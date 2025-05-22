# Web Scraper Comparison Report

Generated on: 2025-05-20T09:28:02.146Z

## Summary

| Scraper | Success Rate | Avg. Duration | Accuracy |
|---------|--------------|---------------|----------|
| BasicScraper | 66.67% | 4516.33ms | 16.67% |
| ResilientScraper | 66.67% | 969.67ms | 16.67% |
| DOMAnalyzerScraper | 66.67% | 864.67ms | 25.00% |

## Rankings

### By Success Rate

1. **BasicScraper**: 66.67%
2. **ResilientScraper**: 66.67%
3. **DOMAnalyzerScraper**: 66.67%

### By Speed

1. **DOMAnalyzerScraper**: 864.67ms
2. **ResilientScraper**: 969.67ms
3. **BasicScraper**: 4516.33ms

### By Accuracy

1. **DOMAnalyzerScraper**: 25.00%
2. **BasicScraper**: 16.67%
3. **ResilientScraper**: 16.67%

## Detailed Results

### Memeorandum (High complexity)

URL: https://memeorandum.com

| Scraper | Success | Duration | Match Score | Content Extract |
|---------|---------|----------|-------------|----------------|
| BasicScraper | ✅ | 1603ms | 33.33% | "memeorandum is an auto-generated summary of the stories that US political commentators are discussing online right now...." |
| ResilientScraper | ✅ | 1033ms | 33.33% | "memeorandum is an auto-generated summary of the stories that US political commentators are discussing online right now...." |
| DOMAnalyzerScraper | ✅ | 945ms | 0.00% | "Trump administration agrees to nearly $5 million settlement in case of Ashli Babbitt's Jan. 6 shooting death..." |

### Metafilter (Medium complexity)

URL: https://www.metafilter.com

| Scraper | Success | Duration | Match Score | Content Extract |
|---------|---------|----------|-------------|----------------|
| BasicScraper | ✅ | 1740ms | 0.00% | "« Older posts..." |
| ResilientScraper | ✅ | 996ms | 0.00% | "In response to about an AskMetaFilter question titled "When did airliner pilots stop drinking, on-the-job? Did they ever?", Jane the Brown posted a comment that touches on just a few subjects, such as..." |
| DOMAnalyzerScraper | ✅ | 945ms | 50.00% | "MetaFilter is a weblog that anyone can contribute a link or a comment to. A typical weblog is one person posting their thoughts on the unique things they find on the web. This website exists to break ..." |

### Fark (High complexity)

URL: https://www.fark.com

| Scraper | Success | Duration | Match Score | Content Extract |
|---------|---------|----------|-------------|----------------|
| BasicScraper | ❌ | 10206ms | 0.00% | Error: page.goto: Timeout 10000ms exceeded.
Call log:
[2m  - navigating to "https://www.fark.com/", waiting until "load"[22m
 |
| ResilientScraper | ❌ | 880ms | 0.00% | Error: Extracted content failed quality validation |
| DOMAnalyzerScraper | ❌ | 704ms | 0.00% | Error: DOM analysis could not identify main content paragraph |

## Conclusions

Based on our testing, **DOMAnalyzerScraper** performs best overall, balancing success rate, speed, and accuracy.

### Strengths and Weaknesses

#### BasicScraper

**Strengths:**

- None identified

**Weaknesses:**

- Low success rate
- Slower execution
- Lower content accuracy

#### ResilientScraper

**Strengths:**

- Good execution speed

**Weaknesses:**

- Low success rate
- Lower content accuracy

#### DOMAnalyzerScraper

**Strengths:**

- Fastest execution time

**Weaknesses:**

- Low success rate
- Lower content accuracy

