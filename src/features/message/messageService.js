// src/features/message/messageService.js
import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api/";
const MESSAGE_URL = API_BASE_URL + "message/";

const getConfig = (token) => {
  if (!token) throw new Error("Token is missing for API request");
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
});

// Send Message service function (keep as is)
const sendMessage = async (messageData, token) => {
  const { content, chatId } = messageData;
  if (!content || !chatId)
    throw new Error("Message content and chatId are required.");
  if (!token) throw new Error("Authentication token is required.");

  try {
    const config = getConfig(token);
    const response = await axiosInstance.post(
      "message/",
      { content, chatId },
      config
    );
    return response.data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.message ||
      "Failed to send message";
    console.error("Send Message Service Error:", message, error.response?.data);
    throw new Error(message);
  }
};

// Fetch Messages service function
// Takes the chatId to fetch messages for
const fetchMessages = async (chatId, token) => {
  if (!chatId) throw new Error("Chat ID is required to fetch messages.");
  if (!token) throw new Error("Authentication token is required.");

  try {
    const config = getConfig(token); // Get headers config
    // Send GET request to MESSAGE_URL/:chatId (e.g., /api/message/60c7...)
    const response = await axiosInstance.get(`message/${chatId}`, config);
    return response.data; // Array of message objects
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.message ||
      "Failed to fetch messages";
    console.error(
      "Fetch Messages Service Error:",
      message,
      error.response?.data
    );
    throw new Error(message);
  }
};

const messageService = {
  sendMessage,
  fetchMessages, // <-- Export fetchMessages
};

export default messageService;
