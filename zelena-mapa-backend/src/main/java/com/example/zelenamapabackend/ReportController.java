package com.example.zelenamapabackend;

import com.example.zelenamapabackend.repository.ReportRepository;
import com.example.zelenamapabackend.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reports")
@CrossOrigin(origins = "*")
public class ReportController {

    private final ReportRepository reportRepo;
    private final UserRepository userRepo;

    public ReportController(ReportRepository reportRepo, UserRepository userRepo) {
        this.reportRepo = reportRepo;
        this.userRepo = userRepo;
    }

    @PostMapping
    public ResponseEntity<Report> createReport(@RequestBody Map<String, String> body, Principal principal) {
        Report report = new Report();
        report.setCategory(body.get("category"));
        report.setDescription(body.get("description"));

        if (principal != null) {
            userRepo.findByEmail(principal.getName())
                    .ifPresent(u -> report.setUsername(u.getUsername()));
        }
        if (report.getUsername() == null || report.getUsername().isBlank()) {
            report.setUsername("Anonimno");
        }

        return ResponseEntity.ok(reportRepo.save(report));
    }

    @GetMapping("/mine")
    public ResponseEntity<List<Report>> myReports(Principal principal) {
        if (principal == null) return ResponseEntity.status(401).build();
        String username = userRepo.findByEmail(principal.getName())
                .map(User::getUsername).orElse("Anonimno");
        return ResponseEntity.ok(reportRepo.findByUsernameOrderByCreatedAtDesc(username));
    }

    @GetMapping("/admin")
    public ResponseEntity<List<Report>> allReports(Principal principal) {
        if (principal == null) return ResponseEntity.status(401).build();
        User user = userRepo.findByEmail(principal.getName()).orElseThrow();
        if (!"ADMIN".equals(user.getRole())) return ResponseEntity.status(403).build();
        return ResponseEntity.ok(reportRepo.findAllByOrderByCreatedAtDesc());
    }

    @PutMapping("/admin/{id}/status")
    public ResponseEntity<Report> updateStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> body,
            Principal principal) {
        if (principal == null) return ResponseEntity.status(401).build();
        User user = userRepo.findByEmail(principal.getName()).orElseThrow();
        if (!"ADMIN".equals(user.getRole())) return ResponseEntity.status(403).build();

        Report report = reportRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Prijava nije pronađena"));
        report.setStatus(body.get("status"));
        return ResponseEntity.ok(reportRepo.save(report));
    }
}