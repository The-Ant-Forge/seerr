import RTAudFresh from '@app/assets/rt_aud_fresh.svg';
import RTAudRotten from '@app/assets/rt_aud_rotten.svg';
import RTFresh from '@app/assets/rt_fresh.svg';
import RTRotten from '@app/assets/rt_rotten.svg';
import ImdbLogo from '@app/assets/services/imdb.svg';
import TmdbLogo from '@app/assets/tmdb_logo.svg';
import Tooltip from '@app/components/Common/Tooltip';
import defineMessages from '@app/utils/defineMessages';
import { type RatingResponse } from '@server/api/ratings';
import { useIntl } from 'react-intl';

const messages = defineMessages('components.Common.MediaRatings', {
  rtcriticsscore: 'Rotten Tomatoes Critics Score',
  rtaudiencescore: 'Rotten Tomatoes Audience Score',
  imdbuserscore: 'IMDb User Score ({formattedCount} votes)',
  tmdbuserscore: 'TMDB User Score',
});

interface MediaRatingsProps {
  ratingData?: RatingResponse;
  voteAverage?: number;
  voteCount?: number;
  tmdbUrl?: string;
  className?: string;
  compact?: boolean;
}

const MediaRatings = ({
  ratingData,
  voteAverage,
  voteCount,
  tmdbUrl,
  className,
  compact = false,
}: MediaRatingsProps) => {
  const intl = useIntl();

  const hasRt =
    ratingData?.rt?.criticsRating &&
    typeof ratingData?.rt?.criticsScore === 'number';
  const hasRtAudience =
    ratingData?.rt?.audienceRating && !!ratingData?.rt?.audienceScore;
  const hasImdb = !!ratingData?.imdb?.criticsScore;
  const hasTmdb = !!voteCount;

  if (!hasRt && !hasRtAudience && !hasImdb && !hasTmdb) {
    return null;
  }

  const iconSize = compact ? 'w-4' : 'w-6';
  const textSize = compact ? 'text-xs' : 'text-sm';

  return (
    <div
      className={
        className ?? 'flex items-center space-x-4 font-medium text-gray-300'
      }
    >
      {hasRt && ratingData?.rt && (
        <Tooltip content={intl.formatMessage(messages.rtcriticsscore)}>
          <a
            href={ratingData.rt.url}
            className="media-rating"
            target="_blank"
            rel="noreferrer"
          >
            {ratingData.rt.criticsRating === 'Rotten' ? (
              <RTRotten className={iconSize} />
            ) : (
              <RTFresh className={iconSize} />
            )}
            <span className={textSize}>{ratingData.rt.criticsScore}%</span>
          </a>
        </Tooltip>
      )}
      {hasRtAudience && ratingData?.rt && (
        <Tooltip content={intl.formatMessage(messages.rtaudiencescore)}>
          <a
            href={ratingData.rt.url}
            className="media-rating"
            target="_blank"
            rel="noreferrer"
          >
            {ratingData.rt.audienceRating === 'Spilled' ? (
              <RTAudRotten className={iconSize} />
            ) : (
              <RTAudFresh className={iconSize} />
            )}
            <span className={textSize}>{ratingData.rt.audienceScore}%</span>
          </a>
        </Tooltip>
      )}
      {hasImdb && ratingData?.imdb && (
        <Tooltip
          content={intl.formatMessage(messages.imdbuserscore, {
            formattedCount: intl.formatNumber(
              ratingData.imdb.criticsScoreCount,
              {
                notation: 'compact',
                compactDisplay: 'short',
                maximumFractionDigits: 1,
              }
            ),
          })}
        >
          <a
            href={ratingData.imdb.url}
            className="media-rating"
            target="_blank"
            rel="noreferrer"
          >
            <ImdbLogo className={`mr-1 ${iconSize}`} />
            <span className={textSize}>{ratingData.imdb.criticsScore}</span>
          </a>
        </Tooltip>
      )}
      {hasTmdb && (
        <Tooltip content={intl.formatMessage(messages.tmdbuserscore)}>
          <a
            href={tmdbUrl}
            className="media-rating"
            target="_blank"
            rel="noreferrer"
          >
            <TmdbLogo className={`mr-1 ${iconSize}`} />
            <span className={textSize}>
              {Math.round((voteAverage ?? 0) * 10)}%
            </span>
          </a>
        </Tooltip>
      )}
    </div>
  );
};

export default MediaRatings;
