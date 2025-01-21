import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import ChatBot from "./components/chatbot";

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
