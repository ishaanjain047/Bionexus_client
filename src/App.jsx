import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import ChatBot from "./components/Chatbot.jsx";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ChatBot />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
