import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  // --- 1. AUTHENTICATION STATE ---
  const [page, setPage] = useState('auth'); // 'auth', 'verify', 'dashboard'
  const [isSignUp, setIsSignUp] = useState(true); // Default: Start at Sign Up
  const [isAdminInvite, setIsAdminInvite] = useState(false);
  
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [verificationCode, setVerificationCode] = useState('');
  const [timer, setTimer] = useState(0); // 45s Cooldown

  // --- 2. USER & DATA STATE ---
  const [userRole, setUserRole] = useState('donor'); // 'admin' or 'donor'
  const [activeTab, setActiveTab] = useState('homepage'); // 'homepage', 'groceries', 'items'
  
  // Data Persistence (Saves to browser so it doesn't disappear on refresh)
  const [introText, setIntroText] = useState(localStorage.getItem('cma_intro') || "Welcome to the CMA Wishlist!");
  const [groceries, setGroceries] = useState(JSON.parse(localStorage.getItem('cma_groceries')) || []);
  const [items, setItems] = useState(JSON.parse(localStorage.getItem('cma_items')) || []);

  // Admin Inputs
  const [newItemName, setNewItemName] = useState('');
  const [newItemLink, setNewItemLink] = useState('');

  // --- 3. ON LOAD: CHECK FOR ADMIN LINK ---
  useEffect(() => {
    // Checks if the URL is your-site.com/?role=admin
    const params = new URLSearchParams(window.location.search);
    if (params.get('role') === 'admin') {
      setIsAdminInvite(true);
      alert("Admin Access Detected! Please Sign Up to claim your Admin powers.");
    }
  }, []);

  // --- 4. SAVE DATA AUTOMATICALLY ---
  useEffect(() => { localStorage.setItem('cma_intro', introText); }, [introText]);
  useEffect(() => { localStorage.setItem('cma_groceries', JSON.stringify(groceries)); }, [groceries]);
  useEffect(() => { localStorage.setItem('cma_items', JSON.stringify(items)); }, [items]);

  // --- 5. TIMER LOGIC ---
  useEffect(() => {
    if (timer > 0) {
      const countdown = setTimeout(() => setTimer(timer - 1), 1000);
      return () => clearTimeout(countdown);
    }
  }, [timer]);

  // --- FUNCTIONS ---

  const handleAuthSubmit = (e) => {
    e.preventDefault();
    if (isSignUp) {
      // Send them to verification
      setPage('verify');
    } else {
      // Login Logic
      setUserRole(form.email.includes('admin') || isAdminInvite ? 'admin' : 'donor');
      setPage('dashboard');
    }
  };

  const startTimer = () => {
    if (timer === 0) setTimer(45);
  };

  const handleVerify = () => {
    // If they came from an admin link, make them an admin now
    if (isAdminInvite) setUserRole('admin');
    setPage('dashboard');
  };

  const handleDonate = (itemName) => {
    // 1. Alert the Donor
    alert(`Thank you for your generous donation to the CMA Kitchen! Your support is truly helpful.`);
    
    // 2. Alert the Admin (Simulating email to ashwinsince2013@gmail.com)
    console.log(`EMAIL SENT TO ashwinsince2013@gmail.com: New donation received! ${form.name || 'A donor'} has contributed towards ${itemName}.`);
  };

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

  const logout = () => {
    setPage('auth');
    setIsSignUp(false); // Logout takes you to Login usually, or reset to Sign Up if preferred
  };

  // --- VIEWS ---

  // VIEW 1: AUTHENTICATION
  if (page === 'auth') {
    return (
      <div className="container">
        <div className="auth-box">
          <div className="login-btn-container">
             {/* Login Button at Top */}
             {!isSignUp ? <h3>Login Mode</h3> : 
               <button onClick={() => setIsSignUp(false)} className="top-login-btn">Already have an account? <b>Login</b></button>
             }
          </div>

          <h2>{isSignUp ? (isAdminInvite ? "Admin Sign Up" : "Create Account") : "Welcome Back"}</h2>
          
          <form onSubmit={handleAuthSubmit}>
            {isSignUp && (
              <input 
                type="text" 
                placeholder="Full Name" 
                value={form.name} 
                onChange={e => setForm({...form, name: e.target.value})} 
                required 
              />
            )}
            <input 
              type="email" 
              placeholder="Email" 
              value={form.email} 
              onChange={e => setForm({...form, email: e.target.value})} 
              required 
            />
            <input 
              type="password" 
              placeholder="Password" 
              value={form.password} 
              onChange={e => setForm({...form, password: e.target.value})} 
              required 
            />
            
            <button type="submit" className="primary-btn">
              {isSignUp ? "Sign Up" : "Login"}
            </button>
          </form>

          {!isSignUp && (
            <button onClick={() => setIsSignUp(true)} className="switch-btn">Need an account? Sign Up</button>
          )}
        </div>
      </div>
    );
  }

  // VIEW 2: VERIFICATION
  if (page === 'verify') {
    return (
      <div className="container">
        <div className="auth-box">
          <h2>Verify Your Email</h2>
          <p>We sent a code to: <strong>{form.email}</strong></p>
          
          <input 
            type="text" 
            placeholder="Enter Code" 
            value={verificationCode}
            onChange={e => setVerificationCode(e.target.value)}
            className="code-input"
          />
          
          <button onClick={handleVerify} className="primary-btn">Verify Account</button>
          
          <div className="verify-actions">
            <button onClick={startTimer} disabled={timer > 0} className="secondary-btn">
              {timer > 0 ? `Wait ${timer}s` : "Refresh Code"}
            </button>
            <button onClick={() => setPage('auth')} className="secondary-btn">
              Change Email
            </button>
          </div>
        </div>
      </div>
    );
  }

  // VIEW 3: DASHBOARD
  return (
    <div className="dashboard">
      <nav className="navbar">
        <div className="logo">CMA Wishlist</div>
        <div className="nav-links">
          <button onClick={() => setActiveTab('homepage')} className={activeTab === 'homepage' ? 'active' : ''}>Wishlist Homepage</button>
          <button onClick={() => setActiveTab('groceries')} className={activeTab === 'groceries' ? 'active' : ''}>Groceries</button>
          <button onClick={() => setActiveTab('items')} className={activeTab === 'items' ? 'active' : ''}>Items</button>
        </div>
        <button onClick={logout} className="logout-btn">Logout</button>
      </nav>

      <div className="main-content">
        
        {/* --- TAB 1: HOMEPAGE --- */}
        {activeTab === 'homepage' && (
          <div className="tab-section">
            <h1>Welcome to CMA Wishlist</h1>
            {userRole === 'admin' ? (
              <div className="admin-editor">
                <textarea 
                  value={introText} 
                  onChange={(e) => setIntroText(e.target.value)}
                  placeholder="Ready to type... (Write the intro here)"
                />
                <div className="admin-controls">
                  <p>Admin Mode Active</p>
                  <button className="invite-link-btn" onClick={() => prompt("Send this link to a friend to make them an Admin:", window.location.origin + "/?role=admin")}>
                    Get Admin Invite Link
                  </button>
                </div>
              </div>
            ) : (
              <div className="donor-display">
                <div className="white-box">
                  {introText}
                </div>
              </div>
            )}
          </div>
        )}

        {/* --- TAB 2 & 3: LISTS --- */}
        {(activeTab === 'groceries' || activeTab === 'items') && (
          <div className="tab-section">
            <h2>{activeTab.toUpperCase()}</h2>

            {/* Admin Add Box */}
            {userRole === 'admin' && (
              <div className="add-box">
                <input 
                  placeholder="Item Name" 
                  value={newItemName} 
                  onChange={e => setNewItemName(e.target.value)} 
                />
                <input 
                  placeholder="Link (Optional)" 
                  value={newItemLink} 
                  onChange={e => setNewItemLink(e.target.value)} 
                />
                <button onClick={addItem}>Add Item</button>
              </div>
            )}

            {/* The List */}
            <div className="items-grid">
              {(activeTab === 'groceries' ? groceries : items).map(item => (
                <div key={item.id} className="item-card">
                  <div className="info">
                    <strong>{item.name}</strong>
                    {item.link && <a href={item.link} target="_blank" rel="noreferrer">View Link</a>}
                  </div>
                  <div className="actions">
                    <button className="dollar-btn" onClick={() => handleDonate(item.name)} title="Donate">$</button>
                    {userRole === 'admin' && (
                      <button className="delete-btn" onClick={() => deleteItem(item.id)}>Delete</button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Empty State Message */}
            {(activeTab === 'groceries' ? groceries : items).length === 0 && (
              <p className="empty-msg">More items will be added soon. Please check back later!</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
