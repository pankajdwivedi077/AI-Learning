package com.example.springAi;

import com.example.springAi.model.Movie;
import com.example.springAi.model.MovieData;
import com.example.springAi.model.MovieMatch;
import jakarta.annotation.PostConstruct;
import org.springframework.ai.embedding.EmbeddingModel;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.json.JsonMapper;

import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Service
public class MovieService {

    private final EmbeddingModel embeddingModel;
    private final JsonMapper jsonMapper;

    private final List<Movie> moviesEmbedding = new ArrayList<>();

    public MovieService(EmbeddingModel embeddingModel, JsonMapper jsonMapper) {
        this.embeddingModel = embeddingModel;
        this.jsonMapper = jsonMapper;
    }

    @PostConstruct
    public void initializeMovies() throws IOException {
        List<MovieData> movieDataList;

        try (InputStream inputStream = new ClassPathResource("movies.json").getInputStream()) {
            movieDataList = jsonMapper.readValue(
                    inputStream, new TypeReference<List<MovieData>>() {});
        }

        // Embed in batches to avoid one API call per movie (free tier rate limits)
        int batchSize = 50;
        for (int start = 0; start < movieDataList.size(); start += batchSize) {
            int end = Math.min(start + batchSize, movieDataList.size());
            List<MovieData> batch = movieDataList.subList(start, end);

            List<String> descriptions = batch.stream()
                    .map(MovieData::getDescription)
                    .toList();

            List<float[]> embeddings = embeddingModel.embed(descriptions);

            for (int i = 0; i < batch.size(); i++) {
                MovieData m = batch.get(i);
                moviesEmbedding.add(new Movie(
                        m.getTitle(),
                        m.getDescription(),
                        embeddings.get(i)
                ));
            }
        }

        System.out.println(moviesEmbedding.size() + " movies loaded with embeddings.");
    }

    public List<MovieMatch> search(String query) {
        float[] queryEmbedding = embeddingModel.embed(query);

        List<MovieMatch> matches = new ArrayList<>();
        for (Movie movie : moviesEmbedding) {
            double similarity = cosineSimilarity(queryEmbedding, movie.getEmbedding());
            matches.add(new MovieMatch(movie.getTitle(), movie.getDescription(), similarity));
        }

        sortBySimilarity(matches);
        return topMatches(matches, 3);
    }

    public List<MovieMatch> similarMovies(String title) {
        Movie selectedMovie = findMovie(title);

        List<MovieMatch> matches = new ArrayList<>();
        for (Movie movie : moviesEmbedding) {
            if (movie.getTitle().equalsIgnoreCase(title)) {
                continue;
            }

            double similarity = cosineSimilarity(
                    selectedMovie.getEmbedding(),
                    movie.getEmbedding());

            matches.add(new MovieMatch(movie.getTitle(), movie.getDescription(), similarity));
        }

        sortBySimilarity(matches);
        return topMatches(matches, 3);   // fixed: was topKMatches
    }

    private Movie findMovie(String title) {
        for (Movie movie : moviesEmbedding) {
            if (movie.getTitle().equalsIgnoreCase(title)) {
                return movie;
            }
        }
        throw new IllegalArgumentException("Movie not found: " + title);
    }

    private double cosineSimilarity(float[] a, float[] b) {
        double dotProduct = 0.0;
        double normA = 0.0;
        double normB = 0.0;

        for (int i = 0; i < a.length; i++) {
            dotProduct += a[i] * b[i];
            normA += a[i] * a[i];
            normB += b[i] * b[i];
        }

        if (normA == 0 || normB == 0) {
            return 0.0;
        }

        return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    }

    private void sortBySimilarity(List<MovieMatch> matches) {
        Collections.sort(matches,
                (first, second) -> Double.compare(second.getMatch(), first.getMatch()));
    }

    private List<MovieMatch> topMatches(List<MovieMatch> matches, int limit) {
        int numberOfMatches = Math.min(limit, matches.size());
        return new ArrayList<>(matches.subList(0, numberOfMatches));
    }
}