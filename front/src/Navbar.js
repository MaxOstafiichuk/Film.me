import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Nav.css';

const Navbar = () => {
  
  const [showDropdown, setShowDropdown] = useState(false);
  const [items] = useState([
    { label: 'Register', link: '/register' },
    { label: 'Search a movie', link: '/movies' },
    { label: 'Login', link: '/login' },
    { label: 'MyHome', link: '/userhome' },
  ]);
  const [visibleItems, setVisibleItems] = useState(items);
  const [hiddenItems, setHiddenItems] = useState([]);

  const handleDropdownClick = () => {
    setShowDropdown((prevShowDropdown) => !prevShowDropdown);
  };

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setVisibleItems([]);
        setHiddenItems(items);
      } else {
        setVisibleItems(items);
        setHiddenItems([]);
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [items]);

  return (
    <div className="nav-links">
      <a href="/userhome"><h2 className='logo'>MovieNest</h2></a>
      {visibleItems.map((item, index) => (
        <span key={index}>
          <Link to={item.link}><button>{item.label}</button></Link>
          {index < visibleItems.length - 1 && <span></span>}
        </span> 
      ))}
      <div className="dropdown">
        {hiddenItems.length > 0 && (
          <button onClick={handleDropdownClick}>...</button>
        )}
        {showDropdown && (
          <div className="dropdown-menu">
            {hiddenItems.map((item, index) => (
              <span key={index}>
                <Link to={item.link}><button>{item.label}</button></Link>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Navbar;