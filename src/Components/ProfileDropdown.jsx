import { Link } from 'react-router-dom';
import { useRef } from 'react';
import './ProfileDropdown.css';

const ProfileDropdown = ({ isOpen, onToggle, onClose, isLogin, onLogout }) => {
    const dropdownRef = useRef(null);

    return (
        <div className='dropdown-container' ref={dropdownRef}>
            <div onClick={onToggle} className='profile'></div>
            {isOpen && (
                <div className='profile-dropdown'>
                    
                    <ul>
                        <Link className='signup-link' to="/signup"><button className='signup-button-profile'>Signup</button></Link>
                        {isLogin ? (
                            <button className='logout-button-profile' onClick={onLogout}>Logout</button>
                        ) : (
                            <Link className='login-link' to="/login"><li>Login</li></Link>
                        )}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default ProfileDropdown;