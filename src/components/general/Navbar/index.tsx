"use client";
import Router from "next/router";

export function Navbar() {
    const tabs = [
        {
            label: "home",
            url: "/"
        },
        {
            label: "cool",
            url: "/cool"
        }
    ]

    return (
        <div>
            {tabs.map((tab) => (
                <button key={tab.url} onClick={() => Router.push(tab.url)}>
                    {tab.label}
                </button>
            ))}
        </div>
    );
}