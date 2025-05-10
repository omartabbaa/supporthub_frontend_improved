import "./BusinessOverviewpage.css";
import { useEffect, useState, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { businesses as businessApi } from '../services/ApiService';
import Fuse from 'fuse.js';
import SearchBar from '../Components/Searchbar';
import BusinessList from '../Components/BusinessList';
import Tooltip from '../Components/Tooltip';

const BusinessOverviewPage = () => {
  const [businesses, setBusinesses] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredBusinesses, setFilteredBusinesses] = useState([]);
  const [helpModeEnabled, setHelpModeEnabled] = useState(false);

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
    <main className={`business-overview-page ${helpModeEnabled ? 'help-mode-enabled' : 'help-mode-disabled'}`}>
      <Helmet>
        <title>Business Overview | SupportHub</title>
        <meta name="description" content="View and manage your businesses in SupportHub. Search, filter, and select businesses to manage departments and projects." />
        <meta name="robots" content="noindex" /> {/* Optional: for private dashboards */}
        <script type="application/ld+json">
          {`
            {
              "@context": "https://schema.org",
              "@type": "WebPage",
              "name": "Business Overview",
              "description": "View and manage your businesses in SupportHub",
              "breadcrumb": {
                "@type": "BreadcrumbList",
                "itemListElement": [
                  {
                    "@type": "ListItem",
                    "position": 1,
                    "name": "Business Overview",
                    "item": "https://yourdomain.com/business-overview"
                  }
                ]
              }
            }
          `}
        </script>
      </Helmet>

      <div className="help-mode-toggle-container">
        <span className="help-mode-label">Help Mode</span>
        <button 
          className={`help-mode-toggle ${helpModeEnabled ? 'active' : ''}`}
          onClick={() => setHelpModeEnabled(!helpModeEnabled)}
          data-tooltip="Toggle help tooltips on/off"
          data-tooltip-position="left"
        >
          <div className="help-mode-toggle-circle"></div>
          <span className="sr-only">Toggle help mode</span>
        </button>
      </div>

      <section className="search-section" aria-label="Search businesses" data-tooltip="Search for specific businesses by name">
        <Tooltip text="Find businesses by typing their name">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search businesses..."
            aria-label="Search businesses by name"
          />
        </Tooltip>
      </section>

      <section className="businesses-section" data-tooltip="Click on a business to manage its departments and projects">
        {filteredBusinesses.length === 0 && searchQuery ? (
          <div className="no-results" role="status">
            <p>No businesses found matching "{searchQuery}"</p>
          </div>
        ) : null}

        <BusinessList businesses={filteredBusinesses} />
      </section>
    </main>
  );
};

export default BusinessOverviewPage;
