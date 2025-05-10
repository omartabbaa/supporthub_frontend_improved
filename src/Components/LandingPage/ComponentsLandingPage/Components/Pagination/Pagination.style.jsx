import styled from "styled-components";

const PaginationStyle = styled.div`
  padding-top: 10px;

  .staco-pagination-list {
    padding: 0;
    list-style: none;
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 10px;

    li {
      min-height: 50px;
      min-width: 50px;
      border-radius: 50%;
      background: ${({ theme }) => theme.colors.whiteColor};
      border: 1px solid ${({ theme }) => theme.colors.blackColor}26;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: 0.3s;

      a {
        height: 100%;
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: ${({ theme }) => theme.fonts.dmSans};
        font-size: 15px;
        font-weight: 500;
        line-height: 30px;
        color: ${({ theme }) => theme.colors.textColor};
        transition: 0.3s;
      }
      &:hover,
      &.active {
        border: 1px solid ${({ theme }) => theme.colors.primary};

        a {
          color: ${({ theme }) => theme.colors.primary};
        }
      }
    }
  }
`;

export default PaginationStyle;
