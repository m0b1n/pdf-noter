import { useState, useRef, useEffect } from "react";
import { useApp } from "../../AppContext";
import "./Chat.css";

const Chat = ({ pdfUrl }) => {
  const { vectorService, ollama } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      // Search the vector database for relevant context
      // Filter by current PDF source if pdfUrl is provided
      const searchResults = await vectorService.search(userMessage, 5, pdfUrl || null);
      
      // Use OllamaService to answer the question with context
      const response = await ollama.answerQuestion(userMessage, searchResults);
      
      setMessages((prev) => [...prev, { role: "assistant", content: response }]);
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I encountered an error while processing your question. Please make sure the PDF has been processed and embedded. Error: " + error.message,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Floating Chat Button */}
      <button
        className={`chat-button ${isOpen ? "chat-button-hidden" : ""}`}
        onClick={() => setIsOpen(true)}
        title="Ask questions about the PDF"
      >
        💬
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="chat-container">
          <div className="chat-header">
            <h3 className="chat-title">PDF Assistant</h3>
            <button
              className="chat-close-button"
              onClick={() => setIsOpen(false)}
              aria-label="Close chat"
            >
              &times;
            </button>
          </div>

          <div className="chat-messages">
            {messages.length === 0 ? (
              <div className="chat-welcome">
                <p>Ask me anything about this PDF document!</p>
                <p className="chat-welcome-hint">
                  I can answer questions based on the content that has been embedded.
                </p>
              </div>
            ) : (
              messages.map((msg, index) => (
                <div
                  key={index}
                  className={`chat-message chat-message-${msg.role}`}
                >
                  <div className="chat-message-content">{msg.content}</div>
                </div>
              ))
            )}
            {isLoading && (
              <div className="chat-message chat-message-assistant">
                <div className="chat-message-content">
                  <span className="chat-loading">Thinking...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="chat-input-container">
            <textarea
              ref={inputRef}
              className="chat-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask a question about the PDF..."
              rows={2}
              disabled={isLoading}
            />
            <button
              className="chat-send-button"
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
            >
              Send
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default Chat;

