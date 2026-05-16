import React from 'react'
import { Outlet } from 'react-router-dom'
import Headers from '../components/Headers'

const ApplicationLayout = () => {
  return (
    <section>
        <Headers/>
        <Outlet/>
    </section>
  )
}

export default ApplicationLayout