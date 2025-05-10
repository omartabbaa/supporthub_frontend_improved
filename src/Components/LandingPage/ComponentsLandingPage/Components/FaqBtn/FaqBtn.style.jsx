import styled from "styled-components";

import PlusImg from "../../assets/images/icons/accordion-plus.png";
import MinusImg from "../../assets/images/icons/accordion-minus.png";

const FaqBtnStyleWrpper = styled.div`
  /*-- template-accordion style --*/
  border: 1px solid ${({ theme }) => theme.colors.blackColor}26;
  border-radius: 15px;
  margin-top: 20px;
  &:first-child {
    border-top-left-radius: 15px !important;
    border-top-right-radius: 15px !important;
  }
  &:last-child {
    border-bottom-left-radius: 15px !important;
    border-bottom-right-radius: 15px !important;
  }
  &.collapsed {
    //  box-shadow: 0px 10px 15px rgba(0, 0, 0, 0.08);
  }

  .accordion-header {
    border: 0 !important;
    border-radius: 15px !important;
    background-color: transparent;
  }

  .accordion-button {
    border-radius: 15px !important;
    font-family: ${({ theme }) => theme.fonts.PlusJakartaSans};
    font-size: 18px;
    font-weight: 700;
    line-height: 24px;
    color: ${({ theme }) => theme.colors.title};
    padding: 18px 20px 20px 50px;
    position: relative;

    &::after {
      position: absolute;
      content: url(${PlusImg});
      top: 22px;
      left: 20px;
      width: 20px;
      height: 20px;
      border: 0 !important;
      background-image: none;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    &:not(.collapsed) {
      background-color: transparent;
      box-shadow: none;

      &::after {
        content: url(${MinusImg});
      }
    }

    &:focus {
      box-shadow: none;
    }
  }

  .accordion-collapse.collapse.show {
    border-radius: 15px;
    box-shadow: 0px 10px 15px ${({ theme }) => theme.colors.blackColor}14;
  }

  .accordion-body {
    padding: 0 20px 20px 50px;
  }

  @media screen and (max-width: 991px) {
    .benefits-faq .template-accordion .accordion-button {
      padding: 16px 0px;
    }
    .benefits-faq .template-accordion .accordion-button::after {
      top: 20px;
    }
    .benefits-faq .template-accordion .accordion-button:not(.collapsed) {
      padding-bottom: 10px;
    }
    .benefits-faq .template-accordion .accordion-body p {
      font-size: 12px;
      line-height: 22px;
    }
  }
  @media screen and (max-width: 767px) {
    .template-accordion .accordion-button {
      font-size: 16px;
      line-height: 30px;
    }
    .template-accordion .accordion-button::after {
      top: 24px;
    }
  }
`;

export default FaqBtnStyleWrpper;
