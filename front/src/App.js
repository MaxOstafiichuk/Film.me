import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import Navbar from './Navbar';
import MovieSearch from './components/MovieSearch';
import Userspage from './components/Userspage';

function App() {
  return (
    <Router>
      <div>
        <Navbar />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/movies" element={<MovieSearch />} />
          <Route path="/userhome" element={<Userspage />} />
          {/* <Route path='/aboutus' element={<Abouteus/>}/> */}
        </Routes>
      </div>
    </Router>
  );
}

export default App;
