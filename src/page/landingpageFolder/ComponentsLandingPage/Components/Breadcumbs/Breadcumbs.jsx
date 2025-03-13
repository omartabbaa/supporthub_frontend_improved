import BreadcumbsStyle from "./Breadcumbs.style";
import ShapeImg1 from "../../assets/images/shape/breadcrumb-shape1.svg";
import ShapeImg2 from "../../assets/images/shape/breadcrumb-shape2.svg";
import BreadcrumbImg from "../../assets/images/shape/breadcrumb-img.svg";
import { NavLink } from "react-router-dom";
import ScrollAnimate from "../ScrollAnimate";

const Breadcumbs = ({ title }) => {
  return (
    <BreadcumbsStyle>
      <div className="bg-shape">
        <div className="shape-img img-1">
          <ScrollAnimate delay={300}><img src={ShapeImg1} alt="shape" /></ScrollAnimate>
        </div>
        <div className="shape-img img-2">
          <ScrollAnimate delay={350}><img src={ShapeImg2} alt="shape" /></ScrollAnimate>
        </div>
      </div>
      <div className="container">
        <div className="row align-items-center">
          <div className="col-md-6">
            <ScrollAnimate delay={200}>
              <div className="breadcrumb-content">
                <nav aria-label="breadcrumb">
                  <ul className="breadcrumb breadcrumb-list">
                    <li className="breadcrumb-item">
                      <NavLink to="/">Home</NavLink>
                    </li>
                    <li className="breadcrumb-item active" aria-current="page">
                      {title}
                    </li>
                  </ul>
                </nav>
                <div className="breadcrumb-sec">
                  <h1 className="breadcrumb-title">{title}</h1>
                </div>
              </div>
            </ScrollAnimate>
          </div>
          <div className="col-md-6">
            <div className="breadcrumb-img">
              <ScrollAnimate delay={250}>
                <img src={BreadcrumbImg} alt="breadcrumb-img" />
              </ScrollAnimate>
            </div>
          </div>
        </div>
      </div>
    </BreadcumbsStyle>
  );
};

export default Breadcumbs;
