import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Login.css';


axios.defaults.withCredentials = true;

const Login = () => {
  const [user_number, setUserNumber] = useState('');
  const [user_password, setUserPassword] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://185.167.78.226:2000/login', { user_number, user_password }, { withCredentials: true });
      setMessage(response.data.message);
      if (response.status === 200) {
        navigate('/userhome');
      }
    } catch (error) {
      setMessage(error.response.data);
    }
  };

  return (
    <div className="login-container">
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="User  Number"
          className="input-field"
          value={user_number}
          onChange={(e) => setUserNumber(e.target.value)} // Corrected here
        />
        <input
          type="password"
          placeholder="Password"
          className="input-field"
          value={user_password}
          onChange={(e) => setUserPassword(e.target.value)} // Corrected here
        />
        <button type="submit" className="login-button">
          Login
        </button>
      </form>
      {message && <p className="error-message">{message}</p>}
    </div>
  );
};

export default Login;