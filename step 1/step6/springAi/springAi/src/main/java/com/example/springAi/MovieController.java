package com.example.springAi;

import com.example.springAi.model.MovieMatch;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/api/movie")
public class MovieController {

    private MovieService movieService;

    @Autowired
    public MovieController(MovieService movieService){
        this.movieService = movieService;
    }

    @GetMapping("/search")
    public List<MovieMatch> search(@RequestParam String query){
       return movieService.search(query);
    }

    @GetMapping("/{title}/similar")
    public List<MovieMatch> similarMovies(@PathVariable String title){
        return movieService.similarMovies(title);
    }

}
