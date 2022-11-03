import Link from "next/link";
import React, { useState } from "react";
import NavItem from "./navbarItem";

const MENU_ITEMS = [
  { text: "Home", href: "/" },
  { text: "About", href: "/about" },
  { text: "Login", href: "login" },
  { text: "Sign Up", href: "/signup" },
  { text: "My Account", href: "/account"},
]

const Navbar = () => {
  const [isOpen, setOpen] = useState<boolean | undefined>(false)
  const [activeIndex, setActiveIndex] = useState<number | undefined>(0) 
  
  const clickOpen = () => {
  setOpen(!isOpen)
  }

  {console.log(activeIndex)}

  return (
    <div className="navbar__container">
      <div className="navbar__logo-divider">

        <div className="navbar__logo">
          <Link href="/">
            <h1>PropaVote</h1>
          </Link>
        </div>
        <div className={`navbar__menu-list ${isOpen ? "navbar__menu-list--open" : "navbar__menu-list--closed"}`}>
          {MENU_ITEMS.map((menu, index) => (
            <Link href={menu.href} key={index}>
              <div
                onClick={() => {
                  setActiveIndex(index)
                }}
                className="navbar__item-container"
              >
                <NavItem active={activeIndex === index} info={menu} />
              </div>
            </Link>
          ))}
          <div className="navbar__hamburger"></div>
        </div>
      </div>
    </div>
  )
}

export default Navbar