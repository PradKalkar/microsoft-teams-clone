import axios from "axios";
import moment from "moment";

export const createUser = async (email, firstName, lastName) => {
  try {
    const data = {
      username: email,
      first_name: firstName,
      last_name: lastName,
      email: email,
    };
    const config = {
      method: "post", // get or create user
      url: "/create_user",
      data: data,
    };
    const response = await axios(config); // send request using axios
    return response.data.id;
  } catch (error) {
    // console.log(error);
  }
};

export const createChat = async (roomId, admin, name) => {
  try {
    const userName = name.length > 0 ? name : admin;
    const today = new Date();
    const formattedDate = moment(today).format("MMMM Do YYYY, h:mm:ss a");
    const data = {
      title: `${userName}'s Meeting@${formattedDate}: Room=${roomId}`,
      admin_username: admin, // one who creates the meeting
    };
    const config = {
      method: "post",
      url: "/create_chat",
      data: data,
    };
    const response = await axios(config); // send request using axios
    return response.data.id; // return the chat id
  } catch (error) {
    // console.log(error);
  }
};

export const deleteChat = async (admin, chatId) => {
  try {
    const data = {
      admin_username: admin, // one who creates the meeting,
      chat_id: chatId,
    };
    const config = {
      method: "post", // get or create user
      url: "/delete_chat",
      data: data,
    };
    await axios(config); // send request using axios
  } catch (error) {
    // console.log(error);
  }
};

export const addUser = async (userName, chatId) => {
  try {
    const data = {
      username: userName,
      chatId: chatId,
    };
    const config = {
      method: "post",
      url: "/add_user",
      data: data,
    };
    await axios(config);
  } catch (error) {
    // console.log(error);
  }
};

export const getChatMsgs = async (roomId) => {
  try {
    const data = {
      room: roomId,
    };
    const config = {
      method: "post",
      url: "/get_chat_msgs",
      data: data,
    };
    const response = await axios(config);
    return response.data;
  } catch (error) {
    // console.log(error);
  }
};

export const sendChatMsg = async (roomId, userName, msg) => {
  try {
    const data = {
      room: roomId,
      username: userName,
      text: msg,
    };
    const config = {
      method: "post",
      url: "/post_chat_msg",
      data: data,
    };
    await axios(config);
  } catch (error) {
    // console.log(error);
  }
};
