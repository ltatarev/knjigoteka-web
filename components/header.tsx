"use client"

import * as React from "react"
import { Menu, X } from "react-feather"
import {
  Container,
  Flex,
  FlexList,
  Space,
  NavLink,
  Button,
  InteractiveIcon,
  Nudge,
  VisuallyHidden,
} from "./ui"
import {
  mobileNavOverlay,
  mobileNavLink,
  desktopHeaderNavWrapper,
  mobileHeaderNavWrapper,
  mobileNavSVGColorWrapper,
} from "./header.css"
import BrandLogo from "./brand-logo"
import { headerNav, headerCta } from "@/lib/layout"

export default function Header() {
  const [isOpen, setOpen] = React.useState(false)

  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflowY = "hidden"
    } else {
      document.body.style.overflowY = "visible"
    }
  }, [isOpen])

  return (
    <header>
      <Container className={desktopHeaderNavWrapper}>
        <Space size={2} />
        <Flex variant="spaceBetween">
          <NavLink to="/">
            <VisuallyHidden>Home</VisuallyHidden>
            <BrandLogo />
          </NavLink>
          <nav>
            <FlexList gap={4}>
              {headerNav.map((navItem) => (
                <li key={navItem.href}>
                  <NavLink to={navItem.href}>{navItem.text}</NavLink>
                </li>
              ))}
            </FlexList>
          </nav>
        </Flex>
      </Container>
      <Container className={mobileHeaderNavWrapper[isOpen ? "open" : "closed"]}>
        <Space size={2} />
        <Flex variant="spaceBetween">
          <span
            className={mobileNavSVGColorWrapper[isOpen ? "reversed" : "primary"]}
          >
            <NavLink to="/">
              <VisuallyHidden>Home</VisuallyHidden>
              <BrandLogo />
            </NavLink>
          </span>
          <Flex>
            <Space />
            <div>
              {headerCta && (
                <Button
                  to={headerCta.href}
                  variant={isOpen ? "reversed" : "primary"}
                >
                  {headerCta.text}
                </Button>
              )}
            </div>
            <Nudge right={3}>
              <InteractiveIcon
                title="Toggle menu"
                onClick={() => setOpen(!isOpen)}
                className={
                  mobileNavSVGColorWrapper[isOpen ? "reversed" : "primary"]
                }
              >
                {isOpen ? <X /> : <Menu />}
              </InteractiveIcon>
            </Nudge>
          </Flex>
        </Flex>
      </Container>
      {isOpen && (
        <div className={mobileNavOverlay}>
          <nav>
            <FlexList responsive variant="stretch">
              {headerNav.map((navItem) => (
                <li key={navItem.href}>
                  <NavLink
                    to={navItem.href}
                    className={mobileNavLink}
                    onClick={() => setOpen(false)}
                  >
                    {navItem.text}
                  </NavLink>
                </li>
              ))}
            </FlexList>
          </nav>
        </div>
      )}
    </header>
  )
}
