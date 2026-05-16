import React from 'react'
import InstanceRequestForm from '../components/InstanceRequestForm'

const RequestInstanceLayout = () => {
  return (
    <div 
      className='rounded-lg shadow-lg shadow-neutral-400 w-[25%] mx-auto opacity-[90%]
                bg-white opacity-[90%]'
    >

        <section className='m-2 p-2 text-center text-xl text-bold font-semibold text-sky-700'>
            Getting Started
        </section>

        <section className='border-white mt-10'>
            <InstanceRequestForm/>
        </section>
    </div>
  )
}

export default RequestInstanceLayout