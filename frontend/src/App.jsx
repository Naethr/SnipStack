import { useEffect, useState } from "react";
import { fetchSnippets } from "./api/snippetsApi";

function App() {
  const [snippets, setSnippets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadSnippets() {
      try {
        const data = await fetchSnippets();
        setSnippets(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }

    loadSnippets();
  }, []);

  if (isLoading) {
    return (
      <main>
        <h1>SnipStack</h1>
        <p>Loading snippets...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main>
        <h1>SnipStack</h1>
        <p>{error}</p>
      </main>
    );
  }

  return (
    <main>
      <h1>SnipStack</h1>

      {snippets.length === 0 ? (
        <p>No snippets yet.</p>
      ) : (
        <ul>
          {snippets.map((snippet) => (
            <li key={snippet.id}>
              <h2>{snippet.title}</h2>
              <p>{snippet.description}</p>
              <p>{snippet.language}</p>
              <pre>
                <code>{snippet.code}</code>
              </pre>
              <p>{snippet.tags}</p>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

export default App;