import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

const CustomSelect = ({ value, onChange, options, placeholder = '-- Choose an option --', label }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target) && !buttonRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div style={{ marginBottom: '1.5rem' }}>
      {label && (
        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
          {label}
        </label>
      )}
      
      <div style={{ position: 'relative' }}>
        <button
          ref={buttonRef}
          onClick={() => setIsOpen(!isOpen)}
          style={{
            width: '100%',
            padding: '0.75rem',
            fontSize: '1rem',
            borderRadius: '8px',
            border: '2px solid var(--color-border)',
            backgroundColor: 'var(--color-bg-secondary)',
            color: 'var(--color-text)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            cursor: 'pointer',
            textAlign: 'left',
            fontFamily: 'inherit'
          }}
        >
          <span>{selectedOption ? selectedOption.label : placeholder}</span>
          <ChevronDown 
            size={20} 
            style={{ 
              transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s'
            }} 
          />
        </button>

        {isOpen && (
          <div
            ref={dropdownRef}
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              marginTop: '0.5rem',
              backgroundColor: '#1e293b',
              border: '2px solid #6366f1',
              borderRadius: '8px',
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5)',
              zIndex: 1000,
              maxHeight: '300px',
              overflowY: 'auto',
              backdropFilter: 'blur(10px)'
            }}
          >
            {options.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  border: 'none',
                  background: value === option.value ? 'rgba(99, 102, 241, 0.3)' : 'transparent',
                  color: value === option.value ? '#ffffff' : '#e2e8f0',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontFamily: 'inherit',
                  transition: 'all 0.2s',
                  borderBottom: '1px solid rgba(148, 163, 184, 0.1)'
                }}
                onMouseEnter={(e) => {
                  if (value !== option.value) {
                    e.target.style.background = 'rgba(99, 102, 241, 0.15)';
                    e.target.style.color = '#ffffff';
                  }
                }}
                onMouseLeave={(e) => {
                  if (value !== option.value) {
                    e.target.style.background = 'transparent';
                    e.target.style.color = '#e2e8f0';
                  }
                }}
              >
                {option.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomSelect;
