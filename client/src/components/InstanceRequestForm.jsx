import React from 'react'
import { useState } from 'react'

const InstanceRequestForm = () => {

    const [isNewUser,setIsNewUser] = useState(true)
    const [instanceType,setInstanceType] = useState('Personal')

    const toggleUserType = (e)=>{
        setIsNewUser(prev=>{
            if(prev){
                return false
            }else{
                return true
            }
        })
    }

    const handlePersonalInstance = (e)=>{
        setInstanceType(prev=>{
            return 'Personal'
        })
    }

    const handleOrganizationInstance = (e)=>{
        setInstanceType(prev=>{
            return 'Organization'
        })
    }
    

  return (
    <section>

        <section>

            {/* User Type Selection */}
            <section className='w-full flex justify-center items-center text-sm text-bold font-semibold'>
                <section className='w-1/2 text-center border-r-1'
                    onClick={toggleUserType}
                >
                    New User
                </section>
                <section className='w-1/2 text-center border-l-1' 
                    onClick={toggleUserType}
                >
                    Existing User
                </section>
            </section>

            {/* Form Section */}
            <form className='flex flex-col justify-center items-center outline-none'>
                
                <section>
                    <input
                        type='text'
                        name='name'
                        placeholder='name'
                        className='w-80 m-2 p-2 border border-neutral-400 rounded-lg outline-none'
                    ></input>
                </section>

                <section>
                    <input
                        type='email'
                        name='email'
                        placeholder='email'
                        className='w-80 m-2 p-2 border border-neutral-400 rounded-lg outline-none'
                    ></input>
                </section>

                <section>
                    <input
                        type='password'
                        name='password'
                        placeholder='password'
                        className='w-80 m-2 p-2 border border-neutral-400 rounded-lg outline-none'
                    >
                    </input>
                </section>

                <section className='m-2 flex justify-center items-center gap-4'>
                    <section>Instance Type</section>
                    
                    <section>
                        <input
                            type='radio'
                            name='InstanceType'
                            id='Personal'
                            value='Personal'
                            onClick={handlePersonalInstance}
                        ></input>
                        <label htmlFor='Personal'>Personal</label>
                    </section>
                    
                    <section>
                        <input
                            type='radio'
                            name='InstanceType'
                            id='Organization'
                            value='Organization'
                            onClick={handleOrganizationInstance}
                        ></input>
                        <label htmlFor='Organization'>Organization</label>
                    </section>

                </section>

                {
                    instanceType === 'Organization' &&
                        (
                            <section>
                                <input
                                    type='text'
                                    name='organizationName'
                                    placeholder='Seach the Organization'
                                    className='w-80 m-3 p-2 border border-neutral-400 rounded-lg outline-none'
                                ></input>
                            </section>
                        )
                    
                }

                {
                    instanceType === 'Organization' && 
                    (
                        <section>
                            <input
                                type='text'
                                name='role'
                                placeholder='Role'
                                className='w-80 m-3 p-2 border border-neutral-400 rounded-lg outline-none'
                            ></input>
                        </section>
                    )
                }

                <button
                    className='w-60 m-2 px-4 py-2 rounded-md text-sm
                    bg-blue-500 text-white font-medium
                    shadow-md
                    hover:bg-blue-600 hover:shadow-lg
                    active:scale-95
                    transition-all duration-200 ease-in-out'
                >
                    Get Instance.
                </button>

            </form>

        </section>

        <section className='m-5 p-2'>

        </section>


    </section>
  )
}

export default InstanceRequestForm