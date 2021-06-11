<template>
   <div class="d-flex" id="wrapper">
      <!-- Sidebar-->
      <div class="border-end bg-white" id="sidebar-wrapper">
        <div class="sidebar-heading border-bottom bg-light">Srum UI</div>
        <div class="list-group list-group-flush">
          <NuxtLink class="list-group-item list-group-item-action list-group-item-light p-3" to="/">Home</NuxtLink>
          <NuxtLink class="list-group-item list-group-item-action list-group-item-light p-3"  to="/scrums">Scrums</NuxtLink>
          <NuxtLink class="list-group-item list-group-item-action list-group-item-light p-3" to="/users">Users</NuxtLink>
        </div>
      </div>
      <!-- Page content wrapper-->
      <div id="page-content-wrapper">
        <!-- Top navigation-->
        <nav class="navbar navbar-expand-lg navbar-light bg-light border-bottom">
          <div class="container-fluid">
            <span @click="toggleSidebar">
            <toggle-icon  style="width: 35px; heigth: 35px;"></toggle-icon>
            </span>
            <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation"><span class="navbar-toggler-icon"></span></button>
            <div class="collapse navbar-collapse" id="navbarSupportedContent">
              <ul class="navbar-nav ms-auto mt-2 mt-lg-0">
                <li class="nav-item active"><a class="nav-link" href="#!">Scrums </a></li>
                <li class="nav-item"><a class="nav-link" href="#!">Users</a></li>
                <!-- <li class="nav-item dropdown"><a class="nav-link dropdown-toggle" id="navbarDropdown" href="#" role="button" data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false">Dropdown</a>
                  <div class="dropdown-menu dropdown-menu-end" aria-labelledby="navbarDropdown"><a class="dropdown-item" href="#!">Action</a><a class="dropdown-item" href="#!">Another action</a>
                    <div class="dropdown-divider"></div><a class="dropdown-item" href="#!">Something else here</a>
                  </div>
                </li> -->
              </ul>
            </div>
          </div>
        </nav>
        <!-- Page content-->
        <div class="container-fluid">
          <Nuxt />
        </div>
      </div>
    </div>
  
</template>

<script>
import ToggleIcon from '../components/ToggleIcon.vue'
export default {
  components: { ToggleIcon },
  name: "LayoutComponent",
  components : {  
    ToggleIcon
 },
  data: () => {
    return {
      greeting: "Hello How are you!"
    }
  },
  methods: {
    toggleSidebar () {
       console.log('Hello')
       document.body.classList.toggle('sb-sidenav-toggled');
    },
  }
}
</script>


<style>
 #wrapper {
	 overflow-x: hidden;
}
 #sidebar-wrapper {
	 min-height: 100vh;
	 margin-left: -15rem;
	 -webkit-transition: margin 0.25s ease-out;
	 -moz-transition: margin 0.25s ease-out;
	 -o-transition: margin 0.25s ease-out;
	 transition: margin 0.25s ease-out;
}
 #sidebar-wrapper .sidebar-heading {
	 padding: 0.875rem 1.25rem;
	 font-size: 1.2rem;
}
 #sidebar-wrapper .list-group {
	 width: 15rem;
}
 #page-content-wrapper {
	 min-width: 100vw;
}
 body.sb-sidenav-toggled #wrapper #sidebar-wrapper {
	 margin-left: 0;
}
 @media (min-width: 768px) {
	 #sidebar-wrapper {
		 margin-left: 0;
	}
	 #page-content-wrapper {
		 min-width: 0;
		 width: 100%;
	}
	 body.sb-sidenav-toggled #wrapper #sidebar-wrapper {
		 margin-left: -15rem;
	}
}
 
</style>
