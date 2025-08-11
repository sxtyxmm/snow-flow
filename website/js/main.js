// Snow-Flow Website JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Mobile Navigation Toggle
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');

    if (hamburger) {
        hamburger.addEventListener('click', function() {
            navMenu.classList.toggle('active');
            
            // Animate hamburger
            const spans = hamburger.querySelectorAll('span');
            if (navMenu.classList.contains('active')) {
                spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
                spans[1].style.opacity = '0';
                spans[2].style.transform = 'rotate(-45deg) translate(7px, -6px)';
            } else {
                spans[0].style.transform = 'none';
                spans[1].style.opacity = '1';
                spans[2].style.transform = 'none';
            }
        });
    }

    // Smooth Scrolling for Navigation Links
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href.startsWith('#')) {
                e.preventDefault();
                const target = document.querySelector(href);
                if (target) {
                    const offset = 80; // Height of navbar
                    const targetPosition = target.offsetTop - offset;
                    window.scrollTo({
                        top: targetPosition,
                        behavior: 'smooth'
                    });
                    
                    // Close mobile menu if open
                    navMenu.classList.remove('active');
                }
            }
        });
    });

    // Tab Functionality for Installation Section
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const tabName = this.getAttribute('data-tab');
            
            // Remove active class from all tabs and contents
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            
            // Add active class to clicked tab and corresponding content
            this.classList.add('active');
            const activeContent = document.getElementById(tabName);
            if (activeContent) {
                activeContent.classList.add('active');
            }
        });
    });

    // Navbar Background on Scroll
    const navbar = document.querySelector('.navbar');
    let lastScroll = 0;

    window.addEventListener('scroll', function() {
        const currentScroll = window.pageYOffset;
        
        if (currentScroll > 100) {
            navbar.style.background = 'rgba(255, 255, 255, 0.98)';
            navbar.style.backdropFilter = 'blur(10px)';
            navbar.style.boxShadow = '0 4px 20px rgba(0,0,0,0.1)';
        } else {
            navbar.style.background = 'white';
            navbar.style.backdropFilter = 'none';
            navbar.style.boxShadow = '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)';
        }

        // Hide/Show navbar on scroll
        if (currentScroll > lastScroll && currentScroll > 500) {
            navbar.style.transform = 'translateY(-100%)';
        } else {
            navbar.style.transform = 'translateY(0)';
        }
        
        lastScroll = currentScroll;
    });

    // Animate Elements on Scroll
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -100px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                
                // Add stagger effect for grid items
                if (entry.target.classList.contains('feature') || 
                    entry.target.classList.contains('mcp-card') ||
                    entry.target.classList.contains('what-is-card')) {
                    const siblings = entry.target.parentElement.children;
                    Array.from(siblings).forEach((sibling, index) => {
                        setTimeout(() => {
                            sibling.style.opacity = '1';
                            sibling.style.transform = 'translateY(0)';
                        }, index * 100);
                    });
                }
            }
        });
    }, observerOptions);

    // Observe elements for animation
    const animateElements = document.querySelectorAll('.feature, .mcp-card, .what-is-card, .workflow-step, .example-card, .practice');
    animateElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });

    // Copy Code Functionality
    const codeBlocks = document.querySelectorAll('pre code');
    codeBlocks.forEach(block => {
        const wrapper = block.parentElement;
        
        // Create copy button
        const copyBtn = document.createElement('button');
        copyBtn.className = 'copy-btn';
        copyBtn.textContent = 'Copy';
        copyBtn.style.cssText = `
            position: absolute;
            top: 10px;
            right: 10px;
            background: rgba(255,255,255,0.1);
            color: white;
            border: 1px solid rgba(255,255,255,0.2);
            padding: 5px 15px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 0.9rem;
            transition: all 0.3s ease;
        `;
        
        wrapper.style.position = 'relative';
        wrapper.appendChild(copyBtn);
        
        copyBtn.addEventListener('click', function() {
            const text = block.textContent;
            navigator.clipboard.writeText(text).then(() => {
                copyBtn.textContent = 'Copied!';
                copyBtn.style.background = '#48bb78';
                copyBtn.style.borderColor = '#48bb78';
                
                setTimeout(() => {
                    copyBtn.textContent = 'Copy';
                    copyBtn.style.background = 'rgba(255,255,255,0.1)';
                    copyBtn.style.borderColor = 'rgba(255,255,255,0.2)';
                }, 2000);
            });
        });
        
        // Show copy button on hover
        wrapper.addEventListener('mouseenter', () => {
            copyBtn.style.opacity = '1';
        });
        
        wrapper.addEventListener('mouseleave', () => {
            if (copyBtn.textContent === 'Copy') {
                copyBtn.style.opacity = '0.7';
            }
        });
    });

    // Active Section Highlighting in Navigation
    const sections = document.querySelectorAll('section[id]');
    
    function highlightNavigation() {
        const scrollPosition = window.scrollY + 100;
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            const sectionId = section.getAttribute('id');
            
            if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                navLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${sectionId}`) {
                        link.classList.add('active');
                    }
                });
            }
        });
    }

    window.addEventListener('scroll', highlightNavigation);

    // Typing Effect for Hero Title
    const heroTitle = document.querySelector('.hero-title');
    if (heroTitle) {
        const text = heroTitle.textContent;
        heroTitle.textContent = '';
        let index = 0;
        
        function typeText() {
            if (index < text.length) {
                heroTitle.textContent += text.charAt(index);
                index++;
                setTimeout(typeText, 100);
            }
        }
        
        // Start typing after a short delay
        setTimeout(typeText, 500);
    }

    // Counter Animation for Stats
    const stats = document.querySelectorAll('.stat-number');
    const statsObserver = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting && !entry.target.classList.contains('counted')) {
                entry.target.classList.add('counted');
                const target = entry.target;
                const value = target.textContent;
                
                // Extract number from string (e.g., "16+" -> 16)
                const number = parseInt(value.replace(/\D/g, ''));
                const suffix = value.replace(/\d/g, '');
                const duration = 2000; // 2 seconds
                const increment = number / (duration / 16); // 60fps
                let current = 0;
                
                const counter = setInterval(() => {
                    current += increment;
                    if (current >= number) {
                        target.textContent = number + suffix;
                        clearInterval(counter);
                    } else {
                        target.textContent = Math.floor(current) + suffix;
                    }
                }, 16);
            }
        });
    }, { threshold: 0.5 });

    stats.forEach(stat => {
        statsObserver.observe(stat);
    });

    // Search Functionality for MCP Tools
    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.placeholder = 'Search MCP tools...';
    searchInput.className = 'mcp-search';
    searchInput.style.cssText = `
        width: 100%;
        max-width: 400px;
        margin: 0 auto 2rem;
        display: block;
        padding: 12px 20px;
        border: 2px solid #e2e8f0;
        border-radius: 25px;
        font-size: 1rem;
        transition: all 0.3s ease;
    `;

    const mcpSection = document.querySelector('#mcp-servers .container');
    if (mcpSection) {
        const subtitle = mcpSection.querySelector('.section-subtitle');
        if (subtitle) {
            subtitle.insertAdjacentElement('afterend', searchInput);
        }

        searchInput.addEventListener('input', function(e) {
            const searchTerm = e.target.value.toLowerCase();
            const mcpCards = document.querySelectorAll('.mcp-card');
            
            mcpCards.forEach(card => {
                const text = card.textContent.toLowerCase();
                if (text.includes(searchTerm)) {
                    card.style.display = 'block';
                    card.style.animation = 'fadeIn 0.3s ease';
                } else {
                    card.style.display = 'none';
                }
            });
        });

        searchInput.addEventListener('focus', function() {
            this.style.borderColor = '#0066cc';
            this.style.boxShadow = '0 0 0 3px rgba(0,102,204,0.1)';
        });

        searchInput.addEventListener('blur', function() {
            this.style.borderColor = '#e2e8f0';
            this.style.boxShadow = 'none';
        });
    }

    // Add Loading Animation
    window.addEventListener('load', function() {
        document.body.classList.add('loaded');
    });

    // Console Easter Egg
    console.log('%c🏔️❄️ Snow-Flow', 'font-size: 30px; font-weight: bold; background: linear-gradient(135deg, #0066cc 0%, #00d4ff 100%); color: white; padding: 10px 20px; border-radius: 10px;');
    console.log('%cAdvanced ServiceNow Development Framework', 'font-size: 14px; color: #666;');
    console.log('%cVersion 3.4.14 | MIT License', 'font-size: 12px; color: #999;');
    console.log('%cInterested in contributing? Visit: https://github.com/groeimetai/snow-flow', 'font-size: 12px; color: #0066cc;');
});