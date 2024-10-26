import React, { useState } from 'react';
import axios from 'axios';
import './Login.css';
axios.defaults.withCredentials = true;


const Login = () => {
  const [user_number, setUserNumber] = useState('');
  const [user_password, setUserPassword] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://185.167.78.226:2000/login', { user_number, user_password },  { withCredentials: true });
      setMessage(response.data.message);
    } catch (error) {
      setMessage(error.response.data);
    }
  };

  return (
    <div>
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="User Number"
          value={user_number}
          onChange={(e) => setUserNumber(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          value={user_password}
          onChange={(e) => setUserPassword(e.target.value)}
        />
        <button type="submit">Login</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
};

export default Login;