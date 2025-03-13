import PaginationStyle from "./Pagination.style";
import { NavLink } from "react-router-dom";

import ArrowLeft from "../../assets/images/icons/pagination-arrow-left.svg";
import ArrowRight from "../../assets/images/icons/pagination-arrow-right.svg";
import ScrollAnimate from "../ScrollAnimate";

const Pagination = () => {
  return (
    <PaginationStyle>
      <ScrollAnimate delay={200}>
      <ul className="staco-pagination-list">
        <li>
          <NavLink href="#">
            <img src={ArrowLeft} alt="Prev" />
          </NavLink>
        </li>
        <li>
          <NavLink href="#">1</NavLink>
        </li>
        <li className="active">
          <NavLink href="#">2</NavLink>
        </li>
        <li>
          <NavLink href="#">3</NavLink>
        </li>
        <li>
          <NavLink href="#">
            <img src={ArrowRight} alt="Next" />
          </NavLink>
        </li>
      </ul>
      </ScrollAnimate>
    </PaginationStyle>
  );
};

export default Pagination;
