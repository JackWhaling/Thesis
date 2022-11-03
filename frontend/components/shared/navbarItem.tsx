import React from "react";

interface INavItem {
  info: any,
  active: boolean,
}

const NavItem : React.FC<INavItem> = ({info, active}: INavItem) => {
  return (
    <div className={`${active ? "navbar__item--active" : "navbar__item"}`}>
      {info.text}
    </div>
  )
}

export default NavItem;