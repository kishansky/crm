import React from 'react'

function Company() {
    return (
        <div className="mt-auto">
          <a
            href="https://onexcode.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col h-20 bg-accent-foreground p-2 font-bold border-t items-center justify-center hover:bg-accent-foreground/90 rounded-2xl m-2"
          >
            <p className="text-white text-xs">A Product of</p>
            <img
              src="https://onexcode.com/assets/onexcode.svg"
              alt="oneXcode"
              className="h-16 w-auto"
            />
          </a>
        </div>
        
    )
}

export default Company
