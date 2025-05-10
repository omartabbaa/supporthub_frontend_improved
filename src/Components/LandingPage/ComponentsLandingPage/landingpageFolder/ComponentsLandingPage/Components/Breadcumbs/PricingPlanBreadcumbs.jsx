import BreadcumbsStyle from "./Breadcumbs.style";

import ShapeImg1 from "../../assets/images/shape/breadcrumb-shape1.svg";
import ShapeImg2 from "../../assets/images/shape/breadcrumb-shape2.svg";
import { NavLink } from "react-router-dom";

const PricingPlanBreadcumbs = () => {
  return (
    <BreadcumbsStyle className="breadcrumb-section pricing-plan-breadcrumb-section">
      <div className="bg-shape">
        <div className="shape-img img-1">
          <img src={ShapeImg1} alt="shape" />
        </div>
        <div className="shape-img img-2">
          <img src={ShapeImg2} alt="shape" />
        </div>
      </div>
      <div className="container">
        <div className="row align-items-center">
          <div className="col-md-6">
            <div className="breadcrumb-content">
              <nav aria-label="breadcrumb">
                <ul className="breadcrumb breadcrumb-list">
                  <li className="breadcrumb-item">
                    <NavLink to="/">Home</NavLink>
                  </li>
                  <li className="breadcrumb-item active" aria-current="page">
                    Pricing Plans
                  </li>
                </ul>
              </nav>
              <div className="breadcrumb-sec">
                <h1 className="breadcrumb-title">Pricing Plans</h1>
              </div>
            </div>
          </div>
          <div className="col-md-6">
            <div className="pricing-plan-breadcrumb-right">
              <div className="best-pricing-selector">
                <form action="/" method="post">
                  <button type="button" className="best-pricing-monthly-btn">
                    Monthly
                  </button>
                  <input
                    type="checkbox"
                    name="best-pricing-selector"
                    id="best-pricing-selector"
                  />
                  <button type="button" className="best-pricing-yearly-btn">
                    Yearly <span>(20% Off)</span>
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </BreadcumbsStyle>
  );
};

export default PricingPlanBreadcumbs;
