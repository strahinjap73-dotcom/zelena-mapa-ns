package com.example.zelenamapabackend;

import com.example.zelenamapabackend.dto.LoginRequest;
import com.example.zelenamapabackend.dto.LoginResponse;
import com.example.zelenamapabackend.dto.RegisterRequest;
import com.example.zelenamapabackend.config.AuthService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public String register(@RequestBody RegisterRequest request) {
        return authService.register(request);
    }

    @PostMapping("/login")
    public LoginResponse LoginResponse(@RequestBody LoginRequest request) {
        return authService.login(request);
    }
}