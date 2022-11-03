import React from "react";

interface INavItem {
  info: any,
  active: boolean,
}

const NavItem : React.FC<INavItem> = ({info, active}: INavItem) => {
  return (
    <div className={`navbar__item ${active ? "navbar__item--active" : "navbar__item--inactive"}`}>
      {info.text}
    </div>
  )
}

export default NavItem;