import React, { useState, useEffect } from 'react';
import './App.css'; 

export default function App() {
  const [view, setView] = useState('auth');
  const [authMode, setAuthMode] = useState('login');
  const [user, setUser] = useState(null);
  
  // Data
  const [items, setItems] = useState([]);
  const [contacts, setContacts] = useState([]);
  
  // Forms & UI
  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '', code: '' });
  const [newItem, setNewItem] = useState({ type: 'item', name: '', link: '', price: '', quantityNeeded: '', units: '', location: '' });
  const [donation, setDonation] = useState({ itemId: null, quantity: 1, dropTime: '' });
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showDonateModal, setShowDonateModal] = useState(false);

  // --- API CALLS ---
  const fetchItems = async () => {
    const res = await fetch('http://localhost:5000/api/items');
    const data = await res.json();
    if (data.success) setItems(data.items);
  };

  const fetchContacts = async () => {
    const res = await fetch(`http://localhost:5000/api/contacts?adminEmail=${user.email}`);
    const data = await res.json();
    if (data.success) setContacts(data.contacts);
  };

  // --- HANDLERS ---
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleAuth = async (e, endpoint) => {
    e.preventDefault();
    if (endpoint === 'signup' && formData.password !== formData.confirmPassword) return setError("Passwords mismatch");
    
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/api/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (data.success) {
        if (endpoint === 'signup') setView('verify');
        else { setUser(data.user); setView('home'); fetchItems(); }
      } else setError(data.message);
    } catch (err) { setError("Server Error"); }
    setLoading(false);
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    const res = await fetch('http://localhost:5000/api/verify', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ email: formData.email, code: formData.code })
    });
    const data = await res.json();
    if (data.success) { setUser(data.user); setView('home'); fetchItems(); }
    else setError("Invalid Code");
  };

  // --- ADMIN: ADD ITEM ---
  const handleAddItem = async (e) => {
    e.preventDefault();
    await fetch('http://localhost:5000/api/items/add', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(newItem)
    });
    setNewItem({ type: 'item', name: '', link: '', price: '', quantityNeeded: '', units: '', location: '' }); // Reset
    fetchItems();
    alert("Item Added!");
  };

  // --- DONOR: DONATE ---
  const openDonateModal = (item) => {
    setDonation({ itemId: item.id, quantity: 1, dropTime: '', max: item.quantityNeeded - item.collected });
    setShowDonateModal(true);
  };

  const submitDonation = async (e) => {
    e.preventDefault();
    await fetch('http://localhost:5000/api/donate', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ ...donation, donorEmail: user.email })
    });
    setShowDonateModal(false);
    fetchItems();
    alert("Thank you! Admins have been notified.");
  };

  // --- VIEWS ---

  if (view === 'home' && user) {
    return (
      <div className="dashboard">
        <header>
          <h2>Hello, {user.name} <span className="role-badge">{user.role}</span></h2>
          <button onClick={() => window.location.reload()} className="btn-secondary">Logout</button>
        </header>

        {/* ADMIN SECTION */}
        {user.role === 'admin' && (
          <div className="admin-section">
            <h3>Add New Request</h3>
            <div className="type-toggle">
              <button className={newItem.type === 'item' ? 'active' : ''} onClick={() => setNewItem({...newItem, type: 'item'})}>Item</button>
              <button className={newItem.type === 'grocery' ? 'active' : ''} onClick={() => setNewItem({...newItem, type: 'grocery'})}>Grocery</button>
            </div>
            
            <form onSubmit={handleAddItem} className="add-form">
              <input placeholder="Name (e.g., Winter Jackets)" value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} required />
              <input placeholder="Price (approx)" value={newItem.price} onChange={e => setNewItem({...newItem, price: e.target.value})} required />
              <div className="row">
                <input placeholder="Qty Needed" type="number" value={newItem.quantityNeeded} onChange={e => setNewItem({...newItem, quantityNeeded: e.target.value})} required />
                {newItem.type === 'grocery' && (
                  <input placeholder="Units (lbs, cans)" value={newItem.units} onChange={e => setNewItem({...newItem, units: e.target.value})} required />
                )}
              </div>
              <input placeholder="Drop-off Location" value={newItem.location} onChange={e => setNewItem({...newItem, location: e.target.value})} required />
              
              {newItem.type === 'item' && (
                <input placeholder="Link to Item (URL)" value={newItem.link} onChange={e => setNewItem({...newItem, link: e.target.value})} required />
              )}
              
              <button className="btn-primary">Add to Wishlist</button>
            </form>
            <div style={{marginTop: '20px'}}>
               <button className="btn-secondary" onClick={fetchContacts}>Load User Contacts</button>
               {contacts.length > 0 && <div className="contacts-list">{contacts.map(c => <div key={c.email}>{c.name} ({c.email}) - {c.role}</div>)}</div>}
            </div>
          </div>
        )}

        {/* WISHLIST GRID */}
        <h3>Current Wishlist Needs</h3>
        <div className="items-grid">
          {items.map(item => {
            const remaining = item.quantityNeeded - item.collected;
            if (remaining <= 0) return null; // Don't show completed items

            return (
              <div key={item.id} className={`item-card ${item.type}`}>
                <div className="card-header">
                  <h4>{item.name}</h4>
                  <span className="tag">{item.type}</span>
                </div>
                <div className="card-body">
                  <p><strong>Needed:</strong> {remaining} {item.units}</p>
                  <p><strong>Est. Price:</strong> {item.price}</p>
                  <p><strong>Drop-off:</strong> {item.location}</p>
                  {item.link && <a href={item.link} target="_blank" rel="noreferrer" className="item-link">View Item Online</a>}
                </div>
                <button className="btn-donate" onClick={() => openDonateModal(item)}>Donate This</button>
              </div>
            );
          })}
          {items.length === 0 && <p className="empty-msg">No active requests at the moment.</p>}
        </div>

        {/* DONATION MODAL */}
        {showDonateModal && (
          <div className="modal-overlay">
            <div className="modal">
              <h3>Confirm Donation</h3>
              <form onSubmit={submitDonation}>
                <label>Quantity to Donate</label>
                <input type="number" min="1" max={donation.max} value={donation.quantity} onChange={e => setDonation({...donation, quantity: e.target.value})} required />
                
                <label>Select Drop-off Time</label>
                <input type="time" value={donation.dropTime} onChange={e => setDonation({...donation, dropTime: e.target.value})} required />
                
                <div className="modal-actions">
                  <button type="submit" className="btn-primary">Confirm & Notify Admins</button>
                  <button type="button" className="btn-secondary" onClick={() => setShowDonateModal(false)}>Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // AUTH VIEWS (Verify/Login/Signup)
  if (view === 'verify') {
    return (
      <div className="auth-wrapper"><div className="auth-card">
        <h2>Verify Email</h2><p>Code sent to {formData.email}</p>
        <form onSubmit={handleVerify}><input name="code" placeholder="Code" onChange={handleChange} required /><button className="btn-primary">Verify</button></form>
        <button onClick={() => setView('auth')} className="link-btn">Back</button>
      </div></div>
    );
  }

  return (
    <div className="auth-wrapper"><div className="auth-card">
      <div className="auth-toggle">
        <button className={authMode==='login'?'active':''} onClick={()=>setAuthMode('login')}>Log In</button>
        <button className={authMode==='signup'?'active':''} onClick={()=>setAuthMode('signup')}>Sign Up</button>
      </div>
      {error && <div className="error-msg">{error}</div>}
      <form onSubmit={(e) => handleAuth(e, authMode)}>
        {authMode==='signup' && <input name="name" placeholder="Full Name" onChange={handleChange} required />}
        <input name="email" type="email" placeholder="Email" onChange={handleChange} required />
        <input name="password" type="password" placeholder="Password" onChange={handleChange} required />
        {authMode==='signup' && <input name="confirmPassword" type="password" placeholder="Confirm Password" onChange={handleChange} required />}
        <button className="btn-primary full-width">{loading?"Processing...":authMode==='login'?"Log In":"Sign Up"}</button>
      </form>
    </div></div>
  );
}