import styled from "styled-components";

const FooterNewsletterStyle = styled.div`
    padding: 30px;
    margin-bottom: 30px;
    border-radius: 20px;
    background: linear-gradient(180deg, rgba(0, 153, 255, 0.20) 0%, rgba(0, 153, 255, 0.04) 100%);
    h5{
        color: ${({ theme }) => theme.colors.whiteColor};
        font-weight: 700;
        line-height: 155.556%;
        margin-bottom: 22px;
    }
        form{
            input{
            border-radius: 35px;
            background: ${({ theme }) => theme.colors.whiteColor};
            height: 50px;
            width: 100%;
            border: none;
            outline: none;
            margin-bottom: 12px;
            padding: 5px 20px;
            &::placeholder{
                color: ${({ theme }) => theme.colors.title};
            }
        }
            button{
                border-radius: 25px;
                background: ${({ theme }) => theme.colors.primary};
                color: ${({ theme }) => theme.colors.whiteColor};
                font-weight: 700;
                width: 140px;
                height: 50px;
            }
        }
`;

export default FooterNewsletterStyle;
