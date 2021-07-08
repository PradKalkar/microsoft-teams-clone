import axios from "axios";

export const createUser = async (email, firstName, lastName) => {
    try {
      const data = {
        "username": email,
        "first_name": firstName,
        "last_name": lastName,
        "email": email
      };
      const config = {
        "method": "post", // get or create user
        "url": "/create_user",
        "data": data,
      };
      const response = await axios(config); // send request using axios
      console.log(response.data);
      return response.data.id;
    } 
    catch (error) {
      console.log(error);
    }
  };

export const createChat = async (roomId, admin) => {
    try {
      const data = {
        title: `meeting_${roomId}`, // for eg meeting_123
        admin_username: admin, // one who creates the meeting
      };
      const config = {
        method: "post",
        url: "/create_chat",
        data: data,
      };
      const response = await axios(config); // send request using axios
      // console.log(response.data);
      return response.data.id; // return the chat id
    } 
    catch (error) {
      // console.log(error);
    }
  };

  export const deleteChat = async (admin, chatId) => {
    try {
      const data = {
        admin_username: admin, // one who creates the meeting,
        chat_id: chatId
      };
      const config = {
        method: "post", // get or create user
        url: "/delete_chat",
        data: data,
      };
      await axios(config); // send request using axios
    } 
    catch (error) {
      // console.log(error);
    }
  };

export const addUser = async (userName, chatId) => {
    try {
      /*****
       * username, (id in backend)
      *****/
      const data = {
        username: userName,
        chatId: chatId
      };
      const config = {
        method: "post",
        url: "/add_user",
        data: data,
      };
      const response = await axios(config);
      console.log(response);
    } catch (error) {
      console.log(error);
    }
  };

export const getChatMsgs = async () => {
    try {
      /*****
       * username, (id in backend)
      *****/
      const data = {
        username: "Saket",
      };
      const config = {
        method: "post",
        url: "/get_chat_msgs",
        data: data,
      };
      const response = await axios(config);
      console.log(response);
    } catch (error) {
      console.log(error);
    }
  };

export const sendChatMsg = async () => {
    try {
      /*****
       * username, (id in backend)
      *****/
      const data = {
        username: "Saket",
        data: {
          "text": "Hello World",
          "custom_json": {"gif": "https://giphy.com/clips/ufc-4eZuG5kNYvDrGc6gYk"}
        }
      };
      const config = {
        method: "post",
        url: "/post_chat_msg",
        data: data,
      };
      const response = await axios(config);
      console.log(response);
    } catch (error) {
      console.log(error);
    }
  }