import "./App.css";
import axios from "axios";
import { useEffect, useState } from "react";

function App() {
  const [helpData, setHelpData] = useState("");
  useEffect(() => {
    async function getHelpData() {
      const help = await axios.get("/help");
      setHelpData(help.data);
    }

    getHelpData();
  }, []);
  return (
    <div className="App">
      <header className="App-header">
        Reading from main site help: {JSON.stringify(helpData)}
      </header>
    </div>
  );
}

export default App;
