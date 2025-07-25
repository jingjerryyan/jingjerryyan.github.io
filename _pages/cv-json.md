---
layout: archive
title: "C.V."
author_profile: false
redirect_from:
  - /resume-json
---

{% include base_path %}

<link rel="stylesheet" href="{{ base_path }}/assets/css/cv-style.css">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css">

<style>
  .archive {
    width: 80%;
    margin: 0 auto;
    float: none;
    padding-right: 0;
  }
  
  @media (min-width: 80em) {
    .archive {
      width: 70%;
    }
  }
.pdf-container {
    width: 100%;
    margin-top: 2rem;
    margin-bottom: 2rem;
  }

  .pdf-viewer {
    width: 100%;
    height: 800px;
    border: 1px solid #ddd;
    border-radius: 4px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }
</style>

{% include cv-template.html %}

<div class="cv-download-links">
  <a href="{{ base_path }}/files/cv.pdf" class="btn btn--primary">Click here to download Jing (Jerry) Yan’s Curriculum Vitae (C.V.)
</a>
</div>
<div class="pdf-container">
  <object 
    data="{{ base_path }}/files/cv.pdf" 
    type="application/pdf" 
    class="pdf-viewer">
    
  </object>
</div>
