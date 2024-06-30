import { globalStyle, globalKeyframes } from "@vanilla-extract/css"
import { theme } from "./theme.css"

globalStyle("body", {
  margin: 0,
  fontFamily: theme.fonts.text,
  color: theme.colors.text,
  backgroundColor: theme.colors.background,
  WebkitFontSmoothing: "antialiased",
  MozOsxFontSmoothing: "grayscale",
  lineHeight: "160%",
  textAlign: "justify"
})

globalStyle("*", {
  boxSizing: "border-box",
})

globalStyle("blockquote", {
  fontWeight: "bold",
  borderLeft: "5px #e76f51 solid",
  backgroundColor: "#e76f5125",
  paddingTop: "5px",
  paddingBottom: "5px",
  paddingLeft: "30px",
  paddingRight: "30px",
  marginInlineStart: 0,
  borderRadius: "15px",
  width: "100%",
})

globalStyle("a", { 
  color: theme.colors.text,
  textDecoration: "none",
})

globalStyle("a:hover", {
  fontWeight: "bold",
  textDecoration: "none",
})

globalKeyframes("zoomInUp", {
  "0%": {
    transform: "scale(0.95) translateY(10px) translateX(-50%)",
    visibility: "hidden",
    opacity: 0,
  },
  "100%": {
    opacity: 1,
    transform: "scale(1), translateY(0) translateX(-50%)",
    visibility: "visible",
  },
})

globalKeyframes("zoomOutDown", {
  "0%": {
    transform: "scale(1) translateY(0) translateX(-50%)",
    opacity: 1,
  },
  "100%": {
    opacity: 0,
    transform: "scale(0.95) translateY(10px) translateX(-50%)",
    visibility: "hidden",
  },
})

globalKeyframes("fadeIn", {
  "0%": {
    visibility: "hidden",
    opacity: 0,
  },
  "100%": {
    opacity: 1,
    visibility: "visible",
  },
})

globalKeyframes("fadeOut", {
  "0%": {
    opacity: 1,
  },
  "100%": {
    opacity: 0,
    visibility: "hidden",
  },
})
