import Link from "next/link";
import { useRouter } from "next/router";
import React, { useContext, useEffect, useState } from "react";
import {
  INITIAL_USER_STATE,
  userContext,
  UserContextType,
} from "../../context/userState";
import { auth } from "../../services/firebase";
import NavItem from "./navbarItem";

const MENU_ITEMS_DEFAULT = [
  { text: "Home", href: "/", type: "link" },
  { text: "Login", href: "/login", type: "link" },
  { text: "Sign Up", href: "/signup", type: "link" },
];

const MENU_ITEMS_LOGGED = [
  { text: "Home", href: "/", type: "link" },
  { text: "My Account", href: "/account", type: "link" },
  { text: "Logout", href: "/", type: "button" },
];

const Navbar = () => {
  const [isOpen, setOpen] = useState<boolean | undefined>(false);
  const [activeIndex, setActiveIndex] = useState<number | undefined>(0);
  const router = useRouter();
  const { userValues, setUserValues } = useContext(
    userContext
  ) as UserContextType;
  const MENU_ITEMS =
    userValues.id === "" ? MENU_ITEMS_DEFAULT : MENU_ITEMS_LOGGED;

  useEffect(() => {
    const index = MENU_ITEMS.findIndex((object) => {
      return object.href === router.pathname;
    });
    setActiveIndex(index);
  }, [router.pathname]);

  const clickOpen = () => {
    setOpen(!isOpen);
  };

  const signOut = () => {
    auth.signOut().then(() => {
      setUserValues(INITIAL_USER_STATE);
      router.push("/");
    });
  };

  return (
    <div className="navbar__container">
      <div className="navbar__logo-divider">
        <div className="navbar__logo">
          <Link href="/">
            <h1>PropaVote</h1>
          </Link>
        </div>
        <div
          className={`navbar__menu-list ${
            isOpen ? "navbar__menu-list--open" : "navbar__menu-list--closed"
          }`}
        >
          {MENU_ITEMS.map((menu, index) =>
            menu.type === "link" ? (
              <Link href={menu.href} key={index}>
                <div
                  onClick={() => {
                    setActiveIndex(index);
                  }}
                  className="navbar__item-container"
                >
                  <NavItem active={activeIndex === index} info={menu} />
                </div>
              </Link>
            ) : (
              <button className="button logout-button" onClick={signOut}>
                {menu.text}
              </button>
            )
          )}
          <div className="navbar__hamburger"></div>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
