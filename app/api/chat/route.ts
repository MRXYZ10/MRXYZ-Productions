import { NextResponse } from "next/server";
import { searchMovies, getTrending, discoverByGenres } from "@/lib/tmdb";
import type { Movie } from "@/types/movie";

// Map common words to TMDB Genre IDs for smart local parsing
const GENRE_MAP: Record<string, number> = {
  action: 28,
  adventure: 12,
  animation: 16,
  comedy: 35,
  crime: 80,
  documentary: 99,
  drama: 18,
  fantasy: 14,
  horror: 27,
  music: 10402,
  mystery: 9648,
  romance: 10749,
  scifi: 878,
  science: 878,
  thriller: 53,
  war: 10752,
};

// Groq-powered chat completion helper (OpenAI-compatible API).
async function groqChat(
  systemPrompt: string,
  userMessage: string,
  history: Array<{ role: string; content: string }>,
  apiKey: string
): Promise<string> {
  try {
    const safeHistory = history
      .filter((item) => (item.role === "user" || item.role === "assistant") && typeof item.content === "string")
      .slice(-12)
      .map((item) => ({ role: item.role as "user" | "assistant", content: item.content.slice(0, 4000) }));

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.GROQ_MODEL || "openai/gpt-oss-120b",
        temperature: 0.7,
        max_tokens: 500,
        messages: [
          { role: "system", content: systemPrompt },
          ...safeHistory,
          { role: "user", content: userMessage.slice(0, 4000) },
        ],
      }),
      signal: AbortSignal.timeout(25000),
    });

    if (!response.ok) {
      const details = await response.text().catch(() => "");
      console.warn(`Groq chat request failed (${response.status}): ${details.slice(0, 300)}`);
      return "";
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content?.trim() ?? "";
  } catch (error) {
    console.error("Groq chat request failed:", error);
    return "";
  }
}

export async function POST(request: Request) {
  try {
    const { prompt, history = [] } = await request.json();

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json(
        { error: "Query prompt is required" },
        { status: 400 }
      );
    }

    const cleanPrompt = prompt.toLowerCase();
    let candidates: Movie[] = [];

    // 1. Fetch Dynamic Movie Candidates from TMDB based on prompt context
    try {
      // Find matches for genres in the query string
      const matchedGenreIds: number[] = [];
      for (const [name, id] of Object.entries(GENRE_MAP)) {
        if (cleanPrompt.includes(name)) {
          matchedGenreIds.push(id);
        }
      }

      if (matchedGenreIds.length > 0) {
        // Query TMDB discover by genres
        const res = await discoverByGenres(matchedGenreIds);
        candidates = res.results || [];
      } else {
        // Otherwise search for query keywords
        const searchWord = prompt.split(" ").slice(0, 3).join(" ");
        const res = await searchMovies(searchWord);
        candidates = res.results || [];
      }

      // Fallback to trending movies if search was empty
      if (candidates.length === 0) {
        const res = await getTrending();
        candidates = res.results || [];
      }
    } catch (tmdbErr) {
      console.error("TMDB fetch failed, falling back to mock movie bank:", tmdbErr);
      // Clean fallback using static mock data
      candidates = [
        {
          id: 27205,
          title: "Inception",
          overview: "Cobb, a skilled thief who commits corporate espionage by infiltrating the subconscious of his targets is offered a chance to regain his old life.",
          poster_path: "/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg",
          backdrop_path: "/8ZTVqvKDQ8emSGUEMjsS4yHAwrp.jpg",
          release_date: "2010-07-15",
          vote_average: 8.4,
          genre_ids: [28, 878, 12]
        },
        {
          id: 155,
          title: "The Dark Knight",
          overview: "Batman raises the stakes in his war on crime. With the help of Lt. Jim Gordon and District Attorney Harvey Dent, Batman sets out to dismantle the remaining criminal organizations that plague the streets.",
          poster_path: "/qJ2tW6WMUDux911r6m7haRef0WH.jpg",
          backdrop_path: "/nMKdUUepR0i5zn0y1T4CsSB5ez.jpg",
          release_date: "2008-07-16",
          vote_average: 8.5,
          genre_ids: [18, 28, 80, 53]
        },
        {
          id: 157336,
          title: "Interstellar",
          overview: "The adventures of a group of explorers who make use of a newly discovered wormhole to surpass the limitations on human space travel.",
          poster_path: "/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg",
          backdrop_path: "/xJHokMbljXjADYdit5fK1B4Q2Nk.jpg",
          release_date: "2014-11-05",
          vote_average: 8.4,
          genre_ids: [12, 18, 878]
        }
      ];
    }

    // Keep top candidates
    candidates = candidates.slice(0, 10);

    // 2. Rank candidates locally; Groq is the only external AI provider used here.
    const queryTerms = cleanPrompt.split(/\W+/).filter((term: string) => term.length > 2);
    const finalRecommendations = candidates
      .map((movie) => {
        const text = `${movie.title} ${movie.overview}`.toLowerCase();
        const score = queryTerms.reduce((total: number, term: string) => total + (text.includes(term) ? 1 : 0), 0);
        return { movie, score };
      })
      .sort((a, b) => b.score - a.score || b.movie.vote_average - a.movie.vote_average)
      .slice(0, 3)
      .map(({ movie }) => movie);

    // 3. Groq Conversation Response Pipeline
    const groqKey = process.env.GROQ_API_KEY;
    let chatbotReply = "";

    const systemPrompt = `You are the MRXYZ Productions AI Movie Concierge, a premium, exceptionally smart movie guide. 
The user is asking for movie suggestions. Recommend these specific movies:
${finalRecommendations.map((m) => `- "${m.title}": ${m.overview}`).join("\n")}

Guidelines:
- Act extremely knowledgeable about movies, directors, and aesthetics.
- Speak in a warm, welcoming, and cinematic tone.
- Elaborate on why the recommended movies match their request perfectly.
- Make your response concise, engaging, and ready for a chat drawer interface.
- Never invent streaming availability or claim to have watched the user's history.
- Avoid spoilers unless the user explicitly asks for them.
- Never mention internal API details unless the user asks how the service works.`;

    if (groqKey) {
      chatbotReply = await groqChat(systemPrompt, prompt, history, groqKey);
    }

    // Fallback: Local recommendation fallback when Groq is unavailable
    if (!chatbotReply) {
      const titles = finalRecommendations.map((m) => `"${m.title}"`).join(", ");
      
      const responses = [
        `Outstanding request! Based on your mood, I highly recommend exploring ${titles}. These films have stellar reviews and represent top-tier filmmaking. Check them out directly in the cards below to save them straight to your MRXYZ Productions watchlist!`,
        `Excellent taste. I've curated a beautiful list matching your request: ${titles}. They offer deep thematic depth, brilliant visuals, and unmatched performances. What aspects of these films sound most appealing to you?`,
        `A superb exploration. You should dive into ${titles} tonight. They perfectly match your request and deliver a truly memorable cinematic experience. Open a title to explore its details, then save it to your watchlist.`,
      ];

      chatbotReply = responses[Math.floor(Math.random() * responses.length)];
    }

    return NextResponse.json({
      reply: chatbotReply,
      movies: finalRecommendations,
    });
  } catch (error) {
    console.error("API Chat route encountered a fatal error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
