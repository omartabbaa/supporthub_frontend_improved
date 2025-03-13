import "./BusinessOverviewpage.css";
import { useEffect, useState, useMemo } from 'react';
import { businesses as businessApi } from '../services/ApiService';
import Fuse from 'fuse.js';
import SearchBar from '../Components/Searchbar';
import BusinessList from '../Components/BusinessList';

const BusinessOverviewPage = () => {
  const [businesses, setBusinesses] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredBusinesses, setFilteredBusinesses] = useState([]);

  useEffect(() => {
    console.log("Attempting to fetch businesses...");
    businessApi.getAll()
      .then(response => {
        console.log("Businesses fetched successfully:", response.data);
        setBusinesses(response.data);
      })
      .catch(error => {
        console.error('Error fetching businesses:', error);
      });
  }, []);

  // Set up Fuse.js with options
  const fuse = useMemo(() => {
    const options = {
      keys: ['name', 'description'], 
      threshold: 0.3,
      includeScore: true,            
    };
    return new Fuse(businesses, options);
  }, [businesses]);

  useEffect(() => {
    if (!searchQuery) {
      setFilteredBusinesses(businesses);
    } else {
      const results = fuse.search(searchQuery);
      setFilteredBusinesses(results.map(result => result.item));
    }
  }, [searchQuery, fuse, businesses]);

  return (
    <div className="mapContainer">
      <SearchBar
        value={searchQuery}
        onChange={setSearchQuery}
        placeholder="Search businesses..."
      />

      {/* Use the BusinessList component here */}
      <BusinessList businesses={filteredBusinesses} />
    </div>
  );
};

export default BusinessOverviewPage;
