import React from 'react';
import { Link } from 'react-router-dom';
import './BusinessList.css';
"use client"
const BusinessList = ({ businesses }) => {
  return (
    <>
      {businesses && businesses.length > 0 ? (
        businesses.map((business) => (
          <Link 
            to={`/department-project-management/${business.businessId}/${business.name}`} 
            key={business.businessId}
          >
            <div className="BusinessCard">
            
                <img 
                  src={business.logo} 
                  alt={`${business.name} logo`}
                  className="image"
                />
             
              <div className="textContainer">
                <div className="Title">{business.name}</div>
                <div className="texting">{business.description}</div>
              </div>
            </div>
          </Link>
        ))
      ) : (
        <p>No businesses found matching your search.</p>
      )}
    </>
  );
};

export default BusinessList;
