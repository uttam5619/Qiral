import React from 'react'
import RequestInstanceLayout from '../Layout/RequestInstanceLayout'
import backgroundImage from '../assets/Fcpm2.jpg'

const RequestInstance = () => {
  return (
    <section 
        className='w-screen min-h-screen
                   flex flex-col gap-10 justify-center items-center bg-cover'
        style={{
            backgroundImage:`url(${backgroundImage})`,
            backgroundRepeat:'no-repeat'
        }}
    >

        <section>
            <section
                className='mt-10 p-2 text-3xl text-bold font-semibold text-neutral-900 text-center'
            >
            </section>

        </section>

        <RequestInstanceLayout/>

    </section>
  )
}

export default RequestInstance