import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import { User, Upload, Trash2, Save, X } from 'lucide-react';

const BACKEND_URL = 'http://localhost:5500'; // Backend URL for image serving

const ProfilePage = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    bio: ''
  });
  const [profilePicture, setProfilePicture] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      console.log('Fetching profile...');
      const response = await API.get('/profile');
      console.log('Profile data received:', response.data);
      setProfile(response.data);
      setFormData({
        firstName: response.data.firstName || '',
        lastName: response.data.lastName || '',
        bio: response.data.bio || ''
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
      console.error('Error response:', error.response);
      setMessage({ type: 'error', text: `Failed to load profile: ${error.response?.data?.message || error.message}` });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleProfilePictureSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)) {
        setMessage({ type: 'error', text: 'Only image files are allowed (jpg, png, gif, webp)' });
        return;
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setMessage({ type: 'error', text: 'File size must be less than 5MB' });
        return;
      }

      setProfilePicture(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      
      // Update profile info
      await API.put('/profile', formData);
      
      // Upload profile picture if selected
      if (profilePicture) {
        const uploadFormData = new FormData();
        uploadFormData.append('profilePicture', profilePicture);
        await API.post('/profile/upload-picture', uploadFormData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      // Refresh profile
      await fetchProfile();
      setIsEditing(false);
      setProfilePicture(null);
      setPreviewUrl(null);
      setMessage({ type: 'success', text: 'Profile updated successfully' });
      
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      console.error('Error saving profile:', error);
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to save profile' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProfilePicture = async () => {
    if (!confirm('Are you sure you want to delete your profile picture?')) return;

    try {
      await API.delete('/profile/picture');
      await fetchProfile();
      setMessage({ type: 'success', text: 'Profile picture deleted successfully' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      console.error('Error deleting profile picture:', error);
      setMessage({ type: 'error', text: 'Failed to delete profile picture' });
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setProfilePicture(null);
    setPreviewUrl(null);
    if (profile) {
      setFormData({
        firstName: profile.firstName || '',
        lastName: profile.lastName || '',
        bio: profile.bio || ''
      });
    }
  };

  if (loading) {
    return (
      <div className="page-container animate-fade-in">
        <div style={{ textAlign: 'center', padding: '2rem' }}>Loading profile...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="page-container animate-fade-in">
        <div style={{ textAlign: 'center', padding: '2rem' }}>Profile not found</div>
      </div>
    );
  }

  return (
    <div className="page-container animate-fade-in">
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <h1 style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <User size={32} /> Profile
        </h1>
        <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem' }}>
          View and manage your profile information
        </p>

        {/* Messages */}
        {message.text && (
          <div
            className="card"
            style={{
              backgroundColor: message.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
              borderLeft: `4px solid ${message.type === 'success' ? '#10b981' : '#ef4444'}`,
              marginBottom: '1.5rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <span style={{ color: message.type === 'success' ? '#10b981' : '#ef4444' }}>
              {message.text}
            </span>
          </div>
        )}

        {/* Profile Picture Section */}
        <div className="card" style={{ marginBottom: '2rem', textAlign: 'center' }}>
          <div style={{
            width: '120px',
            height: '120px',
            borderRadius: '50%',
            backgroundColor: 'rgba(99, 102, 241, 0.1)',
            margin: '0 auto 1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            border: '2px solid rgba(99, 102, 241, 0.3)'
          }}>
            {previewUrl || profile.profilePicture ? (
              <img
                src={previewUrl || `${BACKEND_URL}${profile.profilePicture}`}
                alt="Profile"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <User size={60} style={{ color: '#6366f1' }} />
            )}
          </div>

          {isEditing ? (
            <div style={{ marginBottom: '1rem' }}>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleProfilePictureSelect}
                style={{ display: 'none' }}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                style={{
                  padding: '0.5rem 1rem',
                  background: '#6366f1',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <Upload size={16} /> Change Picture
              </button>
            </div>
          ) : null}

          {profile.profilePicture && !isEditing && (
            <button
              onClick={handleDeleteProfilePicture}
              style={{
                padding: '0.5rem 1rem',
                background: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.9rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <Trash2 size={16} /> Delete Picture
            </button>
          )}
        </div>

        {/* Profile Information */}
        <div className="card" style={{ marginBottom: '2rem' }}>
          {!isEditing ? (
            <>
              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Name
                </h3>
                <p style={{ margin: 0, fontSize: '1.1rem' }}>
                  {formData.firstName || formData.lastName ? `${formData.firstName} ${formData.lastName}`.trim() : 'Not set'}
                </p>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Email
                </h3>
                <p style={{ margin: 0 }}>{profile.email}</p>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Bio
                </h3>
                <p style={{ margin: 0, color: formData.bio ? 'inherit' : 'var(--color-text-muted)' }}>
                  {formData.bio || 'No bio added yet'}
                </p>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Member Since
                </h3>
                <p style={{ margin: 0 }}>
                  {new Date(profile.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>

              <button
                onClick={() => setIsEditing(true)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: '#6366f1',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                Edit Profile
              </button>
            </>
          ) : (
            <>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                  First Name
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  placeholder="Enter first name"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    border: '1px solid rgba(148, 163, 184, 0.2)',
                    backgroundColor: 'rgba(15, 23, 42, 0.5)',
                    color: '#e2e8f0',
                    fontSize: '1rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                  Last Name
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  placeholder="Enter last name"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    border: '1px solid rgba(148, 163, 184, 0.2)',
                    backgroundColor: 'rgba(15, 23, 42, 0.5)',
                    color: '#e2e8f0',
                    fontSize: '1rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                  Bio (max 500 characters)
                </label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  placeholder="Tell us about yourself"
                  maxLength={500}
                  rows={5}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    border: '1px solid rgba(148, 163, 184, 0.2)',
                    backgroundColor: 'rgba(15, 23, 42, 0.5)',
                    color: '#e2e8f0',
                    fontSize: '1rem',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box',
                    resize: 'vertical'
                  }}
                />
                <small style={{ color: 'var(--color-text-muted)', display: 'block', marginTop: '0.25rem' }}>
                  {formData.bio.length}/500 characters
                </small>
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                  onClick={handleSaveProfile}
                  disabled={saving}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    background: '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <Save size={18} /> Save Changes
                </button>
                <button
                  onClick={handleCancel}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    background: 'transparent',
                    color: '#94a3b8',
                    border: '1px solid rgba(148, 163, 184, 0.2)',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <X size={18} /> Cancel
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
