import React, { useState } from 'react';
import axios from 'axios';
import './Register.css'; // Ensure to create this CSS file

const Register = () => {
  const [user_name, setUserName] = useState('');
  const [user_surname, setUserSurname] = useState('');
  const [user_number, setUserNumber] = useState('');
  const [user_password, setUserPassword] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    try {
      const response = await axios.post('http://185.167.78.226:2000/register', {
        user_name,
        user_surname,
        user_number,
        user_password,
      });

      if (response && response.data) {
        console.log("All good!");
        setMessage(response.data.message);
      }
    } catch (error) {
      if (error.response) {
        console.error('Error response:', error.response.data);
        setMessage(error.response.data.message || 'An error occurred during registration.');
      } else if (error.request) {
        console.error('Error request:', error.request);
        setMessage('No response received from the server. Please try again later.');
      } else {
        console.error('Error:', error.message);
        setMessage('An error occurred while processing the request.');
      }
    }
  };

  return (
    <div className="register-container">
      <h2>Register</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="First Name"
          value={user_name}
          onChange={(e) => setUserName(e.target.value)}
        />
        <input
          type="text"
          placeholder="Surname"
          value={user_surname}
          onChange={(e) => setUserSurname(e.target.value)}
        />
        <input
          type="text"
          placeholder="User  Number"
          value={user_number}
          onChange={(e) => setUserNumber(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          value={user_password}
          onChange={(e) => setUserPassword(e.target.value)}
        />
        <button type="submit">Register</button>
      </form>
      {message && <p className="error-message">{message}</p>}
    </div>
  );
};

export default Register;