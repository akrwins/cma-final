import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  // --- AUTH & NAV STATE ---
  const [page, setPage] = useState('auth'); // auth, verify, dashboard
  const [activeTab, setActiveTab] = useState('homepage'); // homepage, groceries, items
  const [isSignUp, setIsSignUp] = useState(true);
  const [userRole, setUserRole] = useState('donor'); 
  const [email, setEmail] = useState('');
  const [timer, setTimer] = useState(0);

  // --- CONTENT STATE ---
  const [introText, setIntroText] = useState("Welcome to the CMA Wishlist! Admins can update this message.");
  
  // Groceries & Items Lists
  const [groceries, setGroceries] = useState([]);
  const [items, setItems] = useState([]);
  
  // Form input for adding new things
  const [newItemName, setNewItemName] = useState('');
  const [newItemLink, setNewItemLink] = useState('');

  // Admin Link Detection
  useEffect(() => {
    if (window.location.search.includes('role=admin')) {
      setUserRole('admin');
      alert("Admin Mode Detected!");
    }
  }, []);

  // Timer for Verification
  useEffect(() => {
    if (timer > 0) {
      const countdown = setTimeout(() => setTimer(timer - 1), 1000);
      return () => clearTimeout(countdown);
    }
  }, [timer]);

  // --- FUNCTIONS ---
  const addItem = () => {
    if (!newItemName) return;
    const newItem = { id: Date.now(), name: newItemName, link: newItemLink };
    if (activeTab === 'groceries') setGroceries([...groceries, newItem]);
    else setItems([...items, newItem]);
    setNewItemName('');
    setNewItemLink('');
  };

  const deleteItem = (id) => {
    if (activeTab === 'groceries') setGroceries(groceries.filter(i => i.id !== id));
    else setItems(items.filter(i => i.id !== id));
  };

  // --- RENDER LOGIC ---

  if (page === 'auth') {
    return (
      <div className="auth-container">
        <div className="auth-header">
          <button onClick={() => setIsSignUp(false)} className={!isSignUp ? "active-tab" : ""}>Login</button>
          <button onClick={() => setIsSignUp(true)} className={isSignUp ? "active-tab" : ""}>Sign Up</button>
        </div>
        <form className="auth-form" onSubmit={(e) => { e.preventDefault(); setPage('verify'); }}>
          <h2>{isSignUp ? "Create Account" : "Welcome Back"}</h2>
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <input type="password" placeholder="Password" required />
          <button type="submit" className="main-btn">{isSignUp ? "Sign Up" : "Login"}</button>
        </form>
      </div>
    );
  }

  if (page === 'verify') {
    return (
      <div className="auth-container">
        <h2>Verify Email</h2>
        <input type="text" placeholder="Enter 4-digit code" className="code-input" />
        <button onClick={() => setPage('dashboard')} className="main-btn">Verify</button>
        <div className="verify-options">
          <button disabled={timer > 0} onClick={() => setTimer(45)}>
            {timer > 0 ? `Cooldown ${timer}s` : "Refresh Code"}
          </button>
          <button onClick={() => setPage('auth')}>Change Email</button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <nav className="nav-bar">
        <span className="logo">CMA Wishlist</span>
        <div className="nav-tabs">
          <button onClick={() => setActiveTab('homepage')} className={activeTab === 'homepage' ? 'active' : ''}>Homepage</button>
          <button onClick={() => setActiveTab('groceries')} className={activeTab === 'groceries' ? 'active' : ''}>Groceries</button>
          <button onClick={() => setActiveTab('items')} className={activeTab === 'items' ? 'active' : ''}>Items</button>
        </div>
        <button onClick={() => setPage('auth')} className="logout-btn">Logout</button>
      </nav>

      <div className="content">
        {/* HOMEPAGE VIEW */}
        {activeTab === 'homepage' && (
          <div className="homepage-view">
            <h1>Welcome to CMA Wishlist</h1>
            {userRole === 'admin' ? (
              <textarea value={introText} onChange={(e) => setIntroText(e.target.value)} placeholder="Type intro here..." />
            ) : (
              <div className="white-box">{introText}</div>
            )}
            {userRole === 'admin' && (
              <button className="special-btn" onClick={() => alert("Share this: ?role=admin")}>Get Admin Link</button>
            )}
          </div>
        )}

        {/* GROCERIES & ITEMS VIEW */}
        {(activeTab === 'groceries' || activeTab === 'items') && (
          <div className="list-view">
            <h2>{activeTab.toUpperCase()}</h2>
            
            {userRole === 'admin' && (
              <div className="admin-add-box">
                <input value={newItemName} onChange={(e) => setNewItemName(e.target.value)} placeholder="Item Name" />
                <input value={newItemLink} onChange={(e) => setNewItemLink(e.target.value)} placeholder="Link (Optional)" />
                <button onClick={addItem}>Add to List</button>
              </div>
            )}

            <div className="item-container">
              {(activeTab === 'groceries' ? groceries : items).map(item => (
                <div key={item.id} className="item-card">
                  <span>{item.name}</span>
                  <div className="item-actions">
                    {item.link && <a href={item.link} target="_blank" rel="noreferrer">View Link</a>}
                    <button className="donate-btn" title="Donate Now">$</button>
                    {userRole === 'admin' && (
                      <button className="delete-btn" onClick={() => deleteItem(item.id)}>Delete</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
