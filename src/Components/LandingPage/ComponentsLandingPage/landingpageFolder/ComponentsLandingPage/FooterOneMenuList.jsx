import React from 'react';
import './FooterOneMenuList.css';

const FooterOneMenuList = () => {
  const menuItems = [
    {
      title: 'Product',
      items: [
        { name: 'Features', link: '#' },
        { name: 'Pricing', link: '#' },
        { name: 'Use Cases', link: '#' },
        { name: 'Integrations', link: '#' }
      ]
    },
    {
      title: 'Resources',
      items: [
        { name: 'Documentation', link: '#' },
        { name: 'Blog', link: '#' },
        { name: 'Community', link: '#' },
        { name: 'Support Center', link: '#' }
      ]
    },
    {
      title: 'Company',
      items: [
        { name: 'About Us', link: '#' },
        { name: 'Careers', link: '#' },
        { name: 'Contact Us', link: '#' },
        { name: 'Terms of Service', link: '#' }
      ]
    }
  ];

  return (
    <div className="footer-menu-list">
      <div className="row">
        {menuItems.map((menu, index) => (
          <div key={index} className="col-lg-4 col-md-4">
            <div className="menu-column">
              <h4>{menu.title}</h4>
              <ul>
                {menu.items.map((item, i) => (
                  <li key={i}>
                    <a href={item.link}>{item.name}</a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FooterOneMenuList; 