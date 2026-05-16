import React, { useState } from 'react'
import authImage from '../assets/authimage.png';
import Google from '../assets/Google_Favicon_2025.svg.png'
import background from '../assets/Fcpm2.jpg'

const AuthLayout = () => {

    const [auth,setAuth]= useState('SignUp')
    const [message, setMessage] = useState('Already have an Account?')

    const handleAuthText = ()=>{
        setAuth(prev => {
            if (prev === 'SignUp') {
                return 'SignIn'
            } else {
                return 'SignUp'
            }
        });

        setMessage(prev=>{
            if(prev == 'Already have an Account?'){
                return 'Want to get registered with Us?'
            }else{
                return prev ='Already have an Account?'
            }
        })
    }


  return (
    <section className='w-screen bg-contain bg-cover'
        style={{
            backgroundImage:`url(${background})`,
            backgroundRepeat:'no-repeat',
            backgroundPosition: 'center'
        }}
    >
    <section className='w-[70%] mx-auto min-h-screen flex justify-between 
                        opacity-[97%]
                        shadow-lg shadow-neutral-900
                        bg-gradient-to-r from-white via-sky-100 to '
                        >

        <section className='w-[560px] mt-16 text-neutral-900'>

            <section>
                {/* Welcome Section */}
                <section
                    className='text-3xl font-bold m-2 p-2 text-center'
                >
                    AutoL
                </section>

                <section
                className='w-[80%] mx-auto text-sm font-semibold text-center'
                >
                    We empower developers and technical teams to intract with database in a more efficient way.
                </section>

            </section>

            <section>
                {/* SignUp/SignIn Section */}
                <form className='text-sm'>

                    <section className='m-2 p-2'>
                        <section htmlFor="email" className='text-left font-bold'>Email</section>
                        <input type="email" id="email" placeholder='abc@gmail.com' 
                        className='w-full h-10 text-white border bg-neutral-900 border-gray-300 rounded-md m-2 p-2 outline-none'
                        />
                    </section>
                    

                    <section className='m-2 p-2'>
                        <section htmlFor="password" className='text-left font-bold'>Password</section>
                        <input type="password" id="password" placeholder='Enter your password' 
                        className='w-full h-10 text-white bg-neutral-900 border border-gray-300 rounded-md m-2 p-2 outline-none'
                        />
                    </section>

                    <section className='m-2 p-2'>
                        <button
                            className='w-full h-10 flex items-center justify-center 
                            border border-orange-200 rounded-md m-2 text-xs text-white bg-neutral-900
                            hover:cursor-pointer
                            hover:[animation:neonShift_1.5s_infinite]
                            transition-all duration-300 ease-out'
                        >
                            {auth}
                        </button>
                    </section>

                </form>

                {/* line break */}
                <section className="mt-2 flex items-center">
                    <section className="h-px w-[47%] mx-auto bg-gray-200 dark:bg-neutral-700"></section>
                        <span className="px-4 text-sm text-gray-500 dark:text-neutral-400">
                            or
                        </span>
                    <section class="h-px w-[47%] mx-auto bg-gray-200 dark:bg-neutral-700"></section>
                </section>

                {/*OAuth button*/}
                <section className='m-2 p-2'>
                    <button className='w-full h-10 flex justify-center gap-2 border border-gray-300 bg-neutral-900 text-white
                            rounded-md m-2 p-2 outline-none text-sm 
                            hover:cursor-pointer
                            hover:[animation:neonShift_1.5s_infinite]
                            transition-all duration-300 ease-out'
                        >
                        <img src={Google} alt="Google" className="w-5 h-5" />
                        <section>{auth} with Google</section>
                    </button>
                </section>

                {/* Change Auth */}
                <section>
                    <section className='text-xs text-gray-600 flex justify-center'>
                        <span>{message}</span>
                        <span>  </span>
                        <span 
                        className='text-red-500 text-bold font-semibold hover:cursor-pointer'
                        onClick={handleAuthText}
                        >
                            {message=='Already have an Account?'?'SignIn':'SignUp'}
                        </span>
                    </section>
                </section>


            </section>

        </section>

        <section className='w-1/2 h-full '>

            {/* Auth image */}
            <section
                className='group w-3/4 h-[550px] mt-16 ml-20 bg-cover bg-center 
                rounded-2xl overflow-hidden
                hover:shadow-lg hover:shadow-orange-200
                transition-all duration-300 ease-in-out relative'
                style={{ backgroundImage: `url(${authImage})` }}
            >

            {/* Overlay */}
            <div className='absolute inset-0 bg-black/40 opacity-0 
                group-hover:opacity-100 
                transition-all duration-300'>
            </div>

            {/* Text Content */}
            <div className='absolute inset-0 flex flex-col justify-center items-center
                opacity-0 group-hover:opacity-100 
                transition-all duration-300 text-white'>
                <h2 className='text-3xl font-bold mb-2'>AutoL</h2>
                <div className='w-full p-2 text-sm text-center'>AutoL bridges natural language and SQL by converting simple human queries into optimized database queries, making data access faster, easier, and more intuitive for all users</div>
            </div>

            </section>
        </section>


    </section>
    </section>
  )
}

export default AuthLayout